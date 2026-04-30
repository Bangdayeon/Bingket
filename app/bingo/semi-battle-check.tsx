import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal as RNModal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import {
  acceptBattleRequest,
  cancelBattleRequest,
  fetchBattleRequestDetail,
  rejectBattleRequest,
  type BattleBoardSummary,
  type BattleRequestDetail,
} from '@/features/battle/lib/battle';
import { fetchBingoForView } from '@/features/bingo/lib/bingo';
import {
  clearSelectedBoardId,
  clearSelectedBoardTitle,
  getSelectedBoardId,
} from '@/features/battle/lib/battle-selection';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Modal } from '@/components/Modal';
import BingoPreview from '@/components/BingoPreview';
import Loading from '@/components/Loading';
import { useMyProfile } from '@/features/mypage/use-my-profile';
import type { BingoData } from '@/types/bingo';

function boardToBingoData(board: BattleBoardSummary): BingoData {
  return {
    id: board.id,
    title: board.title,
    grid: board.grid,
    theme: board.theme,
    cells: board.cells,
    maxEdits: 0,
    achievedCount: board.checkedCount,
    bingoCount: board.bingoCount,
    dday: 0,
    startDate: null,
    targetDate: board.targetDate,
    state: 'progress',
    retrospective: null,
  };
}

export default function SemiBattleCheckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestId, variant, friendUsername, friendAvatarUrl } = useLocalSearchParams<{
    requestId: string;
    variant: 'sent' | 'received';
    friendUsername: string;
    friendAvatarUrl: string;
  }>();

  const myProfile = useMyProfile();
  const isReceived = variant === 'received';

  const [detail, setDetail] = useState<BattleRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [myBingo, setMyBingo] = useState<BingoData | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedBingo, setSelectedBingo] = useState<BingoData | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!requestId) return;

      const boardId = getSelectedBoardId();
      if (boardId) {
        setSelectedBoardId(boardId);
        clearSelectedBoardId();
        clearSelectedBoardTitle();
      }

      if (!detail) {
        fetchBattleRequestDetail(requestId)
          .then(setDetail)
          .finally(() => setLoading(false));
      }
    }, [requestId]),
  );

  useEffect(() => {
    if (!selectedBoardId) {
      setMyBingo(null);
      return;
    }
    fetchBingoForView(selectedBoardId).then((result) => {
      if (result) setMyBingo(result.bingo);
    });
  }, [selectedBoardId]);

  const handleCancel = async () => {
    setActing(true);
    try {
      await cancelBattleRequest(requestId);
      router.back();
    } catch {
      setErrorMessage('취소에 실패했어요.');
    } finally {
      setActing(false);
      setCancelConfirm(false);
    }
  };

  const handleReject = async () => {
    setActing(true);
    try {
      await rejectBattleRequest(requestId);
      router.back();
    } catch {
      setErrorMessage('거절에 실패했어요.');
    } finally {
      setActing(false);
      setRejectConfirm(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedBoardId) return;
    setActing(true);
    try {
      const { battleId } = await acceptBattleRequest({
        requestId,
        receiverBoardId: selectedBoardId,
      });
      router.replace({ pathname: '/bingo/battle-status', params: { battleId } });
    } catch {
      setErrorMessage('승인에 실패했어요.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingTop: insets.top }}
      >
        <Loading color="#6ADE50" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-body-md text-gray-400">대결 정보를 불러올 수 없어요.</Text>
      </View>
    );
  }

  const senderBingo = boardToBingoData(detail.senderBoard);

  // sent: 나=sender(me), 상대방=receiver(friend from params)
  // received: 나=receiver(me), 상대방=sender(detail)
  const leftProfile = isReceived
    ? { avatarUrl: detail.senderAvatarUrl, sub: `${detail.senderDisplayName}` }
    : { avatarUrl: myProfile?.avatarUrl ?? null, sub: '나' };

  const rightProfile = isReceived
    ? { avatarUrl: myProfile?.avatarUrl ?? null, sub: '나' }
    : { avatarUrl: friendAvatarUrl || null, sub: `@${friendUsername}` };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">대결장 확인</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 100 }}
      >
        <View className="flex items-center justify-center gap-2 bg-blue-100 py-5 rounded-3xl">
          {/* 제목 */}
          {detail.title && (
            <Text className="text-title-md font-pretendard-semibold">
              {'< '}
              {detail.title}
              {' >'}
            </Text>
          )}

          {/* 프로필 */}
          <View className="flex-row gap-8 items-center">
            <View className="flex justify-center items-center gap-1">
              <ProfileAvatar size={40} avatarUrl={leftProfile.avatarUrl} />
              <Text className="text-caption-sm text-gray-800">{leftProfile.sub}</Text>
            </View>
            <Text className="font-pretendard-semibold pb-1">VS</Text>
            <View className="flex justify-center items-center gap-1">
              <ProfileAvatar size={40} avatarUrl={rightProfile.avatarUrl} />
              <Text className="text-caption-sm text-gray-800">{rightProfile.sub}</Text>
            </View>
          </View>

          {/* 빙고 카드 */}
          <View className="flex-row gap-6">
            {/* 왼쪽: 항상 sender 빙고 — received면 친구 카드(모달), sent면 나 카드(액션 없음) */}
            <BingoPreview
              bingo={senderBingo}
              completedCells={detail.senderBoard.completedCells}
              size="sm"
              className="w-[40%] mt-2 rounded-2xl overflow-hidden"
              onPress={isReceived ? () => setSelectedBingo(senderBingo) : undefined}
            />

            {/* 오른쪽: sent=?, received=내 빙고 선택(페이지 이동) */}
            {isReceived ? (
              myBingo ? (
                <BingoPreview
                  bingo={myBingo}
                  size="sm"
                  className="w-[40%] mt-2 rounded-2xl overflow-hidden"
                  onPress={() => router.push('/bingo/battle-select-board')}
                />
              ) : (
                <Pressable
                  className="items-center justify-center flex bg-blue-200 mt-2 w-[40%] rounded-2xl py-10"
                  onPress={() => router.push('/bingo/battle-select-board')}
                >
                  <Text className="text-body-md font-pretendard-medium text-gray-800">
                    빙고 고르기
                  </Text>
                </Pressable>
              )
            ) : (
              <View className="items-center justify-center flex bg-blue-400 mt-2 w-[40%] rounded-2xl">
                <Text className="text-[30px]">?</Text>
              </View>
            )}
          </View>

          {/* 내기 내용 */}
          {detail.betText && (
            <View className="w-full items-center px-5 gap-3 mt-10">
              <Text className="text-title-md font-pretendard-semibold">내기 내용</Text>
              <View className="bg-white w-full px-4 py-3 rounded-lg">
                <Text>{detail.betText}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View className="px-5 gap-3" style={{ paddingBottom: insets.bottom + 16 }}>
        {!isReceived ? (
          <Button label="취소하기" variant="dangerous" onClick={() => setCancelConfirm(true)} />
        ) : (
          <View className="flex-row gap-3">
            <Button
              label="거절하기"
              variant="dangerous"
              onClick={() => setRejectConfirm(true)}
              style={{ flex: 1 }}
            />
            <Button
              label="승인하기"
              onClick={handleAccept}
              disabled={!selectedBoardId}
              loading={acting}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>

      <Modal
        visible={cancelConfirm}
        title="대결 요청 취소"
        body="친구에게 보낸 대결 요청을 취소할까요?"
        variant="warning"
        confirmLabel="취소하기"
        cancelLabel="돌아가기"
        onConfirm={handleCancel}
        onCancel={() => setCancelConfirm(false)}
        onDismiss={() => setCancelConfirm(false)}
      />

      <Modal
        visible={rejectConfirm}
        title="정말로 거절할까요?"
        variant="warning"
        confirmLabel="거절하기"
        cancelLabel="돌아가기"
        onConfirm={handleReject}
        onCancel={() => setRejectConfirm(false)}
        onDismiss={() => setRejectConfirm(false)}
      />

      <Modal
        visible={!!errorMessage}
        title="오류"
        body={errorMessage ?? ''}
        variant="error"
        confirmLabel="확인"
        onConfirm={() => setErrorMessage(null)}
        onDismiss={() => setErrorMessage(null)}
      />

      {/* 확대 오버레이 */}
      <RNModal visible={!!selectedBingo} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/80 items-center justify-center"
          onPress={() => setSelectedBingo(null)}
        >
          {selectedBingo && (
            <View className="w-full px-5">
              <BingoPreview
                bingo={selectedBingo}
                className="w-full"
                size="md"
                completedCells={detail.senderBoard.completedCells}
              />
            </View>
          )}
        </Pressable>
      </RNModal>
    </View>
  );
}
