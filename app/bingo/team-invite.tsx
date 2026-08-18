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
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { WriteBingo } from '@/features/bingo/bingo-edit/WriteBingo';
import {
  acceptTeamInvite,
  fetchTeamInvite,
  rejectTeamInvite,
  type TeamInviteItem,
} from '@/features/team/lib/team';
import { calcDaysUntilStart, calcTeamDday, isTeamStarted } from '@/features/team/lib/team-result';
import { TEAM_MODE_DESCRIPTION, TEAM_MODE_LABEL } from '@/types/team';
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
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // own 모드에서 직접 쓰는 내 빙고
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
      <View className="flex-1 items-center justify-center bg-white">
        <Loading color="#6ADE50" />
      </View>
    );
  }

  const ownerBoard = invite?.ownerBoard ?? null;
  const isOwnMode = invite?.mode === 'own';
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

  const handleAccept = async () => {
    if (!invite || acting) return;

    if (isOwnMode) {
      const [cols, rows] = selectedGrid.split('x').map(Number);
      if (!myTitle.trim()) return setAlertMessage('제목을 입력해주세요.');
      if (cellsRef.current.filter((c) => c?.trim()).length < cols * rows)
        return setAlertMessage('빙고 칸을 모두 채워주세요.');
    }

    setActing(true);
    try {
      await acceptTeamInvite({
        teamId,
        board: isOwnMode
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
      setAlertMessage(e instanceof Error ? e.message : '수락에 실패했어요.');
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
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">팀 빙고 초대</Text>
        <View className="w-8" />
      </View>

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
          <View className="mx-5 mt-6 gap-3">
            <View className="flex-row items-center gap-3">
              <ProfileAvatar avatarUrl={invite.ownerAvatarUrl} size={40} />
              <Text className="text-body-md flex-1">
                {invite.ownerDisplayName}님이 함께하자고 초대했어요
              </Text>
            </View>

            <Text className="font-pretendard-semibold text-3xl">{invite.title}</Text>

            <View className="bg-green-100 rounded-2xl px-4 py-3 gap-1">
              <Text className="text-body-sm font-pretendard-semibold">
                {TEAM_MODE_LABEL[invite.mode]}
              </Text>
              <Text className="text-caption-md" style={{ color: '#4C5252' /* gray-700 */ }}>
                {TEAM_MODE_DESCRIPTION[invite.mode]}
              </Text>
            </View>

            <View className="bg-gray-100 rounded-2xl px-4 py-3 gap-1">
              <Text className="text-body-md">
                {invite.startDate.replaceAll('-', '.')} ~ {invite.endDate.replaceAll('-', '.')}
              </Text>
              <Text className="text-caption-md text-gray-700">
                {started
                  ? `기간이 ${calcTeamDday(invite.endDate)}일 남았어요`
                  : `${calcDaysUntilStart(invite.startDate)}일 후 다 같이 시작해요`}
              </Text>
              <Text className="text-caption-md text-gray-700">
                지금 {invite.memberCount}명이 참여 중이에요
              </Text>
            </View>

            {invite.betText && (
              <View className="bg-gray-100 rounded-2xl px-4 py-3">
                <Text className="text-caption-md text-gray-700 mb-1">내기 내용</Text>
                <Text className="text-body-md">{invite.betText}</Text>
              </View>
            )}
          </View>

          {/* shared/copied: 어떤 빙고인지 보여준다 */}
          {!isOwnMode && previewBingo && (
            <View className="mt-8 items-center">
              <Text className="text-title-md mb-3 font-pretendard-semibold">
                {invite.mode === 'shared' ? '같이 채울 빙고' : '내가 받게 될 빙고'}
              </Text>
              <View className="rounded-xl overflow-hidden">
                <BingoPreview
                  bingo={previewBingo}
                  className="w-64 md:w-[360px]"
                  completedCells={ownerBoard?.completedCells}
                />
              </View>
              <Text className="text-caption-md text-gray-600 mt-3 mx-5 text-center">
                {invite.mode === 'shared'
                  ? '먼저 누른 사람이 그 칸의 주인이 돼요.'
                  : '같은 내용으로 내 빙고가 만들어져요.'}
              </Text>
            </View>
          )}

          {/* own: 내 빙고를 직접 쓴다 */}
          {isOwnMode && (
            <View className="mt-8">
              <Text className="text-title-md mx-5 mb-3 font-pretendard-semibold">
                내 빙고 만들기
              </Text>
              <Text className="text-caption-md text-gray-600 mx-5 mb-3">
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
          className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-5 bg-white pt-3 border-t border-gray-100"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <Button
            label="거절하기"
            variant="secondary"
            onClick={() => setShowRejectModal(true)}
            className="flex-1"
          />
          <Button
            label={acting ? '처리 중...' : '함께하기'}
            variant="primary"
            onClick={handleAccept}
            className="flex-1"
          />
        </View>
      )}

      <Modal
        visible={showRejectModal}
        title="초대를 거절할까요?"
        body="거절하면 이 팀 빙고에 참여할 수 없어요."
        variant="warning"
        cancelLabel="취소하기"
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
