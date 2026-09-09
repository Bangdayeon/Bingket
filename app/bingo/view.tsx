import * as Sentry from '@sentry/react-native';
import { PageHeader } from '@/components/PageHeader';
import { BingoCard } from '@/features/bingo/components/BingoCard';
import { BingoCellModal, type MemoSaveState } from '@/features/bingo/BingoCellModal';
import {
  fetchBingoForView,
  updateCell,
  updateRetrospective,
  calcBingoCount,
} from '@/features/bingo/lib/bingo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import type { FetchedBingo } from '@/features/bingo/lib/bingo';
import type { BingoCellDetail } from '@/types/bingo-cell';
import { fetchMyTeams } from '@/features/team/lib/team';
import type { TeamAvatarMember } from '@/features/team/components/TeamAvatars';
import Loading from '@/components/Loading';
import { Modal } from '@/components/Modal';

// 시안: 완료 빙고의 메모는 300자까지
const MEMO_MAX_LENGTH = 300;

export default function BingoViewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bingoId } = useLocalSearchParams<{ bingoId: string }>();

  const [data, setData] = useState<FetchedBingo | null>(null);
  const [cellDetails, setCellDetails] = useState<BingoCellDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<{ teamId: string; members: TeamAvatarMember[] } | null>(null);
  const [modalTarget, setModalTarget] = useState<number | null>(null);
  const [retrospective, setRetrospective] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const memoDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  /** 아직 서버에 못 보낸 메모. 닫을 때 밀어넣고, 실패하면 여기 남는다 */
  const pendingMemoRef = useRef<Record<string, string>>({});
  const [memoSaveState, setMemoSaveState] = useState<Record<string, MemoSaveState | undefined>>({});
  const retroDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bingoId) return;
    fetchBingoForView(bingoId)
      .then((result) => {
        setData(result);
        if (result) {
          setCellDetails(result.cellDetails);
          setRetrospective(result.bingo.retrospective ?? '');
        }
      })
      // 연결이 끊겨 조회에 실패해도 로딩 스피너에 갇히지 않게 한다
      .catch(Sentry.captureException)
      .finally(() => setLoading(false));
    fetchMyTeams()
      .then((teams) => {
        const found = teams.find((t) => t.myBoardId === bingoId && !t.isInvite);
        if (found) setTeam({ teamId: found.teamId, members: found.members });
      })
      .catch(Sentry.captureException);
  }, [bingoId]);

  /**
   * 저장이 끝내 실패하면 화면만 채워진 채로 남아 다음 진입에 되돌아간다.
   * 그 전에 알려준다. rollback을 받은 경우 저장 전 상태로 되돌린다.
   */
  const handleSaveFailure = (error: unknown, rollback?: () => void) => {
    Sentry.captureException(error);
    rollback?.();
    setSaveFailed(true);
  };

  const handleCellUpdate = (
    cellId: string,
    updates: Partial<Pick<BingoCellDetail, 'completed' | 'completedAt' | 'memo'>>,
  ) => {
    const previousCells = cellDetails;
    setCellDetails((prev) => prev.map((c) => (c.id === cellId ? { ...c, ...updates } : c)));

    const { memo, ...nonMemoUpdates } = updates;
    if (Object.keys(nonMemoUpdates).length > 0) {
      updateCell(cellId, nonMemoUpdates).catch((error) =>
        handleSaveFailure(error, () => setCellDetails(previousCells)),
      );
    }
    if (memo !== undefined) {
      clearTimeout(memoDebounceRef.current[cellId]);
      pendingMemoRef.current[cellId] = memo;
      setMemoSaveState((prev) => ({ ...prev, [cellId]: 'saving' }));
      memoDebounceRef.current[cellId] = setTimeout(() => saveMemo(cellId), 500);
    }
  };

  /** 메모는 입력 중일 수 있어 실패해도 되돌리지 않고 알리기만 한다 */
  const saveMemo = (cellId: string) => {
    const memo = pendingMemoRef.current[cellId];
    if (memo === undefined) return;
    delete pendingMemoRef.current[cellId];
    updateCell(cellId, { memo })
      .then(() => setMemoSaveState((prev) => ({ ...prev, [cellId]: 'saved' })))
      .catch((error) => {
        // 실패한 텍스트를 되살릴 수 있게 다시 대기열에 넣는다
        pendingMemoRef.current[cellId] = memo;
        setMemoSaveState((prev) => ({ ...prev, [cellId]: 'error' }));
        handleSaveFailure(error);
      });
  };

  /**
   * 대기 중인 메모를 즉시 저장한다. 모달을 닫는 순간 500ms를 더 기다릴 이유가 없고,
   * 그 사이 화면을 떠나면 저장 결과를 받을 곳이 없어진다.
   */
  const flushPendingMemos = () => {
    for (const cellId of Object.keys(pendingMemoRef.current)) {
      clearTimeout(memoDebounceRef.current[cellId]);
      saveMemo(cellId);
    }
  };

  const handleRetrospectiveChange = (text: string) => {
    setRetrospective(text);
    if (retroDebounceRef.current) clearTimeout(retroDebounceRef.current);
    retroDebounceRef.current = setTimeout(() => {
      updateRetrospective(bingoId, text).catch((error) => handleSaveFailure(error));
    }, 500);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Loading />
      </View>
    );
  }

  if (!data) return null;

  const { bingo } = data;
  const isDone = bingo.state === 'done';
  const completedCells = cellDetails.map((c) => c.completed);

  const [cols, rows] = bingo.grid.split('x').map(Number);
  const liveBingo = {
    ...bingo,
    achievedCount: completedCells.filter(Boolean).length,
    bingoCount: calcBingoCount(completedCells, cols, rows),
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <BingoCard
          bingo={liveBingo}
          completedCells={completedCells}
          onCellPress={(index) => setModalTarget(index)}
          onEditPress={
            isDone
              ? undefined
              : () => router.push({ pathname: '/bingo/modify', params: { bingoId: bingo.id } })
          }
          teamMembers={team?.members}
          onTeamPress={
            team
              ? () =>
                  router.push({ pathname: '/bingo/team-status', params: { teamId: team.teamId } })
              : undefined
          }
        />

        {isDone && (
          <View className="mt-2 px-4">
            <Text className="mb-2 text-body-md text-gray-900">메모</Text>
            <TextInput
              value={retrospective}
              onChangeText={handleRetrospectiveChange}
              placeholder="메모를 입력해주세요."
              placeholderTextColor="#929898" /* gray-500 */
              multiline
              maxLength={MEMO_MAX_LENGTH}
              textAlignVertical="top"
              style={{
                height: 190,
                backgroundColor: '#EFEFEF' /* gray-200 */,
                borderRadius: 16,
                padding: 12,
                lineHeight: 20,
                color: '#181C1C' /* gray-900 */,
              }}
            />
            <Text className="mt-1 text-right text-caption-sm text-gray-500">
              {retrospective.length}/{MEMO_MAX_LENGTH}
            </Text>
          </View>
        )}
      </ScrollView>

      <BingoCellModal
        visible={modalTarget !== null}
        cells={cellDetails}
        initialIndex={modalTarget ?? 0}
        onClose={() => {
          flushPendingMemos();
          setModalTarget(null);
        }}
        onUpdate={handleCellUpdate}
        memoSaveState={memoSaveState}
        readOnly={isDone}
      />

      <Modal
        visible={saveFailed}
        title="저장하지 못했어요"
        body="네트워크 연결이 불안정해요. 연결을 확인한 뒤 다시 시도해 주세요."
        variant="single"
        confirmLabel="확인"
        onConfirm={() => setSaveFailed(false)}
        onDismiss={() => setSaveFailed(false)}
      />
    </View>
  );
}
