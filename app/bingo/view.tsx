import * as Sentry from '@sentry/react-native';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState } from '@/components/ErrorState';
import { BingoCard } from '@/features/bingo/components/BingoCard';
import { BingoCellModal, type MemoSaveState } from '@/features/bingo/BingoCellModal';
import {
  fetchBingoForView,
  updateCell,
  updateRetrospective,
  calcBingoCount,
} from '@/features/bingo/lib/bingo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import type { FetchedBingo } from '@/features/bingo/lib/bingo';
import type { BingoCellDetail } from '@/types/bingo-cell';
import { fetchMyTeams } from '@/features/team/lib/team';
import type { TeamAvatarMember } from '@/features/team/components/TeamAvatars';
import Loading from '@/components/Loading';
import { Modal } from '@/components/Modal';
import { useTranslation } from 'react-i18next';

const MEMO_MAX_LENGTH = 300;

export default function BingoViewScreen() {
  const { t } = useTranslation();
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
  const pendingMemoRef = useRef<Record<string, string>>({});
  const [memoSaveState, setMemoSaveState] = useState<Record<string, MemoSaveState | undefined>>({});
  const retroDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loadFailed, setLoadFailed] = useState(false);

  const loadBoard = useCallback(() => {
    if (!bingoId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    fetchBingoForView(bingoId)
      .then((result) => {
        setData(result);
        if (result) {
          setCellDetails(result.cellDetails);
          setRetrospective(result.bingo.retrospective ?? '');
        } else {
          setLoadFailed(true);
        }
      })
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, [bingoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (!bingoId) return;
    fetchMyTeams()
      .then((teams) => {
        const found = teams.find((t) => t.myBoardId === bingoId && !t.isInvite);
        if (found) setTeam({ teamId: found.teamId, members: found.members });
      })
      .catch(Sentry.captureException);
  }, [bingoId]);

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

  const saveMemo = (cellId: string) => {
    const memo = pendingMemoRef.current[cellId];
    if (memo === undefined) return;
    delete pendingMemoRef.current[cellId];
    updateCell(cellId, { memo })
      .then(() => setMemoSaveState((prev) => ({ ...prev, [cellId]: 'saved' })))
      .catch((error) => {
        pendingMemoRef.current[cellId] = memo;
        setMemoSaveState((prev) => ({ ...prev, [cellId]: 'error' }));
        handleSaveFailure(error);
      });
  };

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

  if (!data || loadFailed) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <PageHeader />
        <ErrorState message={t('home.loadFail')} onRetry={loadBoard} />
      </View>
    );
  }

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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 40 }}
      >
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
          <View className="mt-8 px-4">
            <Text className="mb-2 text-body-md text-gray-900">{t('home.memo')}</Text>
            <TextInput
              value={retrospective}
              onChangeText={handleRetrospectiveChange}
              placeholder={t('home.memoPlaceholder')}
              multiline
              maxLength={MEMO_MAX_LENGTH}
              textAlignVertical="top"
              className="h-[190px] rounded-2xl bg-gray-200 p-3 text-body-md text-gray-900 placeholder:text-gray-500"
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
        title={t('home.saveFail')}
        body={t('common.error.retry')}
        variant="single"
        confirmLabel={t('common.confirm')}
        onConfirm={() => setSaveFailed(false)}
        onDismiss={() => setSaveFailed(false)}
      />
    </View>
  );
}
