import * as Sentry from '@sentry/react-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import BingoPreview from '@/components/BingoPreview';
import Loading from '@/components/Loading';
import { PageHeader } from '@/components/PageHeader';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { WriteBingo } from '@/features/bingo/bingo-edit/WriteBingo';
import {
  acceptErrorMessage,
  acceptTeamInvite,
  fetchTeamInvite,
  rejectTeamInvite,
  type TeamInviteItem,
} from '@/features/team/lib/team';
import { calcDaysUntilStart, calcTeamDday, isTeamStarted } from '@/features/team/lib/team-result';
import { TEAM_MODE_LABEL } from '@/types/team';
import type { BingoData } from '@/types/bingo';

const editCountKey = (maxEdits: number): string =>
  maxEdits === 9999 || maxEdits === -1 ? '무제한' : String(maxEdits);

export default function TeamInviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();

  const [invite, setInvite] = useState<TeamInviteItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  /** 경쟁하기에서 내 빙고 작성 단계로 넘어갔는지 */
  const [composing, setComposing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // 경쟁하기 모드에서 직접 쓰는 내 빙고
  const [myTitle, setMyTitle] = useState('');
  const [selectedGrid, setSelectedGrid] = useState('3x3');
  const [selectedEditCount, setSelectedEditCount] = useState('0');
  const [selectedTheme, setSelectedTheme] = useState('default');
  const cellsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!teamId) return;
    fetchTeamInvite(teamId)
      .then((data) => {
        setInvite(data);
        if (data) setMyTitle(data.title);
      })
      .catch(() => setAlertMessage('초대를 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Loading />
      </View>
    );
  }

  const ownerBoard = invite?.ownerBoard ?? null;
  const isCompetition = invite?.mode === 'competition';
  const started = invite ? isTeamStarted(invite.startDate) : false;

  const previewBingo: BingoData | null = ownerBoard
    ? {
        id: ownerBoard.id,
        title: ownerBoard.title,
        grid: ownerBoard.grid,
        theme: ownerBoard.theme,
        cells: ownerBoard.cells,
        maxEdits: 0,
        achievedCount: ownerBoard.checkedCount,
        bingoCount: ownerBoard.bingoCount,
        dday: invite ? calcTeamDday(invite.endDate) : 0,
        startDate: invite?.startDate ?? null,
        targetDate: invite?.endDate ?? null,
        state: 'progress',
        retrospective: null,
      }
    : null;

  /**
   * 경쟁하기는 수락하면 내 빙고를 새로 만들어야 한다. 시안에는 작성 화면이 없어서
   * 같은 화면에서 2단계로 나눴다 — '수락하고 빙고 만들기'를 누르면 작성 UI가 펼쳐지고,
   * 거기서 한 번 더 눌러야 실제로 합류한다.
   */
  const confirmLabel = isCompetition
    ? composing
      ? '빙고 만들기'
      : '수락하고 빙고 만들기'
    : '같이하기';

  const handleConfirm = () => {
    if (isCompetition && !composing) {
      setComposing(true);
      return;
    }
    void handleAccept();
  };

  const handleAccept = async () => {
    if (!invite || acting) return;

    if (isCompetition) {
      const [cols, rows] = selectedGrid.split('x').map(Number);
      if (!myTitle.trim()) return setAlertMessage('제목을 입력해주세요.');
      if (cellsRef.current.filter((c) => c?.trim()).length < cols * rows)
        return setAlertMessage('빙고 칸을 모두 채워주세요.');
    }

    setActing(true);
    try {
      await acceptTeamInvite({
        teamId,
        board: isCompetition
          ? {
              title: myTitle.trim(),
              grid: selectedGrid,
              theme: selectedTheme,
              editCount: selectedEditCount,
              cells: cellsRef.current,
            }
          : invite.mode === 'copied' && ownerBoard
            ? {
                title: ownerBoard.title,
                grid: ownerBoard.grid,
                theme: ownerBoard.theme,
                editCount: editCountKey(invite.ownerBoardMaxEdits),
                cells: ownerBoard.cells,
              }
            : undefined,
      });
      router.replace({ pathname: '/bingo/team-status', params: { teamId } });
    } catch (e) {
      Sentry.captureException(e);
      setAlertMessage(acceptErrorMessage(e));
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    setShowRejectModal(false);
    setActing(true);
    try {
      await rejectTeamInvite(teamId);
      router.back();
    } catch (e) {
      setAlertMessage(e instanceof Error ? e.message : '거절에 실패했어요.');
    } finally {
      setActing(false);
    }
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title={invite ? TEAM_MODE_LABEL[invite.mode] : '초대'} />

      {!invite ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-body-md text-gray-400">초대를 찾을 수 없어요.</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-6 gap-3 px-4">
            <View className="flex-row items-center gap-3">
              <ProfileAvatar avatarUrl={invite.ownerAvatarUrl} size={32} />
              <Text className="flex-1 text-body-md text-gray-900">
                {invite.ownerDisplayName}님이 빙고
                {isCompetition ? '로 경쟁하고' : '를 함께하고'} 싶어해요
              </Text>
            </View>

            <Text className="text-body-md text-gray-800">
              진행 기간: {invite.startDate.replaceAll('-', '.')} ~{' '}
              {invite.endDate.replaceAll('-', '.')}
            </Text>
            <View>
              <Text className="text-body-sm text-gray-700">
                {started
                  ? `종료일까지 ${calcTeamDday(invite.endDate)}일 남았어요`
                  : `${calcDaysUntilStart(invite.startDate)}일 후 다 같이 시작해요`}
              </Text>
              <Text className="text-body-sm text-gray-700">
                지금 {invite.memberCount}명이 참여 중이에요
              </Text>
            </View>

            {invite.betText && (
              <View className="rounded-2xl bg-gray-200 px-4 py-3">
                <Text className="mb-1 text-caption-md text-gray-700">내기 내용</Text>
                <Text className="text-body-md text-gray-900">{invite.betText}</Text>
              </View>
            )}
          </View>

          {previewBingo && !composing && (
            <View className="mt-8">
              <BingoPreview
                bingo={previewBingo}
                className="w-full"
                completedCells={ownerBoard?.completedCells}
              />
            </View>
          )}

          {/* own: 수락 버튼을 누른 뒤에 내 빙고를 쓴다 */}
          {composing && (
            <View className="mt-8">
              <Text className="px-4 pb-2 text-caption-md text-gray-700">
                기간은 초대한 사람이 정한 그대로예요. 목표만 자유롭게 정하면 돼요.
              </Text>
              <BingoTitle value={myTitle} onChange={setMyTitle} />
              <WriteBingo
                title={myTitle}
                selectedGrid={selectedGrid}
                onGridSelect={setSelectedGrid}
                selectedEditCount={selectedEditCount}
                onEditCountSelect={setSelectedEditCount}
                selectedTheme={selectedTheme}
                onThemeSelect={setSelectedTheme}
                cells={[]}
                onCellsChange={(v) => {
                  cellsRef.current = v;
                }}
              />
            </View>
          )}
        </ScrollView>
      )}

      {invite && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row gap-2 bg-surface px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <Button
            label={composing ? '이전' : '거절하기'}
            variant="secondary"
            size="md"
            onClick={composing ? () => setComposing(false) : () => setShowRejectModal(true)}
            className="flex-1"
          />
          <Button
            label={acting ? '처리 중...' : confirmLabel}
            variant="primary"
            size="md"
            onClick={handleConfirm}
            className="flex-1"
          />
        </View>
      )}

      <Modal
        visible={showRejectModal}
        title="초대를 거절할까요?"
        body="거절하면 이 팀 빙고에 참여할 수 없어요."
        variant="warning"
        cancelLabel="취소"
        confirmLabel="거절하기"
        onCancel={() => setShowRejectModal(false)}
        onDismiss={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />

      <Modal
        visible={alertMessage !== null}
        title={alertMessage ?? ''}
        variant="single"
        confirmLabel="확인"
        onConfirm={() => setAlertMessage(null)}
      />
    </View>
  );
}
