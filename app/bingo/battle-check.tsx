import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import { Modal } from '@/components/Modal';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import {
  acceptBattleRequest,
  fetchBattleRequestDetail,
  type BattleBoardSummary,
  type BattleRequestDetail,
} from '@/features/battle/lib/battle';
import { getSelectedBoardId, clearSelectedBoardId } from '@/features/battle/lib/battle-selection';
import BingoPreview from '@/components/BingoPreview';
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

export default function BattleCheckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  const [detail, setDetail] = useState<BattleRequestDetail | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!requestId) return;

      const boardId = getSelectedBoardId();
      if (boardId) {
        setSelectedBoardId(boardId);
        clearSelectedBoardId();
      }

      if (!detail) {
        fetchBattleRequestDetail(requestId)
          .then(setDetail)
          .finally(() => setLoading(false));
      }
    }, [requestId]),
  );

  const handleAccept = async () => {
    if (!requestId || !selectedBoardId) return;
    setAccepting(true);
    try {
      await acceptBattleRequest({ requestId, receiverBoardId: selectedBoardId });
      setSuccessModal(true);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <Text className="text-body-md text-gray-400">요청을 불러올 수 없어요.</Text>
      </View>
    );
  }

  const senderBingoData = boardToBingoData(detail.senderBoard);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300 dark:border-gray-700">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">대결 요청 확인</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 32 }}
      >
        {/* 요청자 이름 */}
        <Text className="text-title-sm text-center mb-2">
          {detail.senderDisplayName}
          <Text className="text-body-md">님이 대결을 신청했어요!</Text>
        </Text>

        {/* 요청자 빙고 미리보기 */}
        <View className="items-center my-6">
          <BingoPreview
            bingo={senderBingoData}
            completedCells={detail.senderBoard.completedCells}
          />
        </View>

        {/* 내기 내용 */}
        {detail.betText ? (
          <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
            <Text className="text-caption-sm text-gray-500 dark:text-gray-400 mb-1">내기 내용</Text>
            <Text className="text-body-md">{detail.betText}</Text>
          </View>
        ) : null}

        {/* 내 빙고 선택 */}
        <View className="mb-4">
          {selectedBoardId ? (
            <View className="p-4 bg-green-50 dark:bg-green-900 rounded-2xl mb-3 flex-row items-center justify-between">
              <Text className="text-caption-sm text-green-700 dark:text-green-300">
                빙고판이 선택됐어요
              </Text>
              <Text
                className="text-caption-sm text-gray-500"
                onPress={() =>
                  router.push({ pathname: '/bingo/battle-select-board', params: { requestId } })
                }
              >
                다시 선택
              </Text>
            </View>
          ) : null}

          <Button
            label="기존 빙고에서 선택하기"
            variant="secondary"
            onClick={() =>
              router.push({ pathname: '/bingo/battle-select-board', params: { requestId } })
            }
            className="mb-3"
          />
          <Button
            label="새 빙고 만들기"
            variant="secondary"
            onClick={() => router.push('/bingo/add')}
          />
        </View>

        {/* 수락 버튼 */}
        <Button
          label="수락하기"
          onClick={handleAccept}
          disabled={!selectedBoardId}
          loading={accepting}
          className="mt-2"
        />
      </ScrollView>

      <Modal
        visible={successModal}
        title="대결 시작!"
        body="배틀이 시작됐어요. 화이팅!"
        variant="success"
        confirmLabel="확인"
        onConfirm={() => {
          setSuccessModal(false);
          router.back();
        }}
        onDismiss={() => {
          setSuccessModal(false);
          router.back();
        }}
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
    </View>
  );
}
