import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import ForwardArrowIcon from '@/assets/icons/ic_arrow_forward.svg';
import { sendBattleRequest, type Friend } from '@/features/battle/lib/battle';
import { fetchMyBingos } from '@/features/bingo/lib/bingo';
import {
  clearSelectedBoardId,
  clearSelectedBoardTitle,
  clearSelectedFriend,
  getSelectedBoardId,
  getSelectedBoardTitle,
  getSelectedFriend,
} from '@/features/battle/lib/battle-selection';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Modal } from '@/components/Modal';

export default function BattleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // bingoId + bingoTitle: BingoAll에서 진입 시 설정됨
  const { bingoId: bingoIdParam, bingoTitle: bingoTitleParam } = useLocalSearchParams<{
    bingoId?: string;
    bingoTitle?: string;
  }>();
  const fromBingo = !!bingoIdParam;

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(bingoIdParam ?? null);
  const [bingoTitle, setBingoTitle] = useState<string | null>(bingoTitleParam ?? null);
  const [loadingBingo] = useState(false);
  const [bingoCount, setBingoCount] = useState<number | null>(null);

  const [friend, setFriend] = useState<Friend | null>(null);
  const [betText, setBetText] = useState('');
  const [sending, setSending] = useState(false);

  // 모달 상태
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // 다른 화면에서 돌아올 때 선택 상태 반영
  useEffect(() => {
    if (fromBingo) return; // BingoAll 진입은 빙고 고정이므로 조회 불필요
    fetchMyBingos().then((list) => setBingoCount(list.length));
  }, [fromBingo]);

  useFocusEffect(
    useCallback(() => {
      const selectedFriend = getSelectedFriend();
      if (selectedFriend) {
        setFriend(selectedFriend);
        clearSelectedFriend();
      }

      const boardId = getSelectedBoardId();
      if (boardId) {
        setSelectedBoardId(boardId);
        clearSelectedBoardId();
        const title = getSelectedBoardTitle();
        setBingoTitle(title);
        clearSelectedBoardTitle();
      }
    }, []),
  );

  const canSend = !!selectedBoardId && !!friend && !!betText.trim();

  const handleSend = async () => {
    if (!selectedBoardId || !friend) return;

    setSending(true);
    try {
      await sendBattleRequest({
        senderBoardId: selectedBoardId,
        receiverId: friend.friendId,
        betText,
      });

      setSuccessModal(true);
    } catch (e) {
      setErrorModal(e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  if (loadingBingo) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
        <Text className="flex-1 text-center text-title-sm">친구와 대결하기</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 32 }}
      >
        {/* 빙고 선택 */}
        <Text className="text-title-sm dark:text-gray-400 mb-2">대결할 빙고</Text>
        {fromBingo ? (
          /* BingoAll에서 진입: 빙고 고정, 선택 불가 */
          <Text className="text-title-sm mb-12">{bingoTitle ?? ''}</Text>
        ) : (
          /* friend-list에서 진입: 빙고 선택 가능 */
          <View className="mb-6 gap-3">
            <Pressable
              className="flex-row items-center justify-between"
              onPress={() => router.push('/bingo/battle-select-board')}
            >
              <Text className="text-body-md">{bingoTitle ?? '현재 빙고에서 선택하기'}</Text>
              <ForwardArrowIcon width={20} height={20} />
            </Pressable>
            {(bingoCount === null || bingoCount < 3) && (
              <Pressable
                className="flex-row items-center justify-between mb-12"
                onPress={() =>
                  router.push({ pathname: '/bingo/add', params: { fromBattle: 'true' } })
                }
              >
                <Text className="text-body-md">새 빙고 만들기</Text>
                <ForwardArrowIcon width={20} height={20} />
              </Pressable>
            )}
          </View>
        )}

        {/* 친구 선택 */}
        <Text className="text-title-sm dark:text-gray-400 mb-2">대결할 친구</Text>
        {fromBingo ? (
          /* BingoAll에서 진입: 친구 선택 가능 */
          <Pressable
            className="flex-row items-center justify-between mb-12"
            onPress={() =>
              router.push({ pathname: '/mypage/friend-list', params: { mode: 'select' } })
            }
          >
            <View className="flex-row gap-2 items-center rounded-2xl">
              {friend && <ProfileAvatar size={28} avatarUrl={friend?.avatarUrl} />}
              <Text className="text-body-md">{friend ? friend.displayName : '친구 선택하기'}</Text>
              {friend ? (
                <Text className="text-caption-sm text-gray-500 dark:text-gray-400">
                  @{friend.username}
                </Text>
              ) : null}
            </View>
            <ForwardArrowIcon width={20} height={20} />
          </Pressable>
        ) : (
          /* friend-list에서 진입: 친구 고정 */
          <View className="flex-row gap-2 items-center rounded-2xl mb-12">
            <ProfileAvatar size={28} avatarUrl={friend?.avatarUrl} />
            <Text className="text-title-sm">{friend?.displayName ?? ''}</Text>
            {friend ? (
              <Text className="text-caption-sm text-gray-500 dark:text-gray-400">
                @{friend.username}
              </Text>
            ) : null}
          </View>
        )}

        {/* 내기 내용 */}
        <View className="mb-6">
          <Text className="text-title-sm mb-2">내기 내용</Text>
          <TextInput
            value={betText}
            onChangeText={setBetText}
            placeholder="예) 커피 한 잔 사기"
            maxLength={100}
            multiline
            numberOfLines={5}
            style={{ height: 120, textAlignVertical: 'top' }}
          />
        </View>

        {/* 대결 요청 버튼 */}
        <Button
          label="대결 요청 보내기"
          onClick={handleSend}
          disabled={!canSend}
          loading={sending}
        />
      </ScrollView>
      <Modal
        visible={successModal}
        title="대결 요청을 보냈어요"
        body={`${friend?.displayName ?? ''}님에게 요청이 전달됐어요.`}
        variant="success"
        confirmLabel="확인"
        onConfirm={() => {
          setSuccessModal(false);
          router.back();
        }}
        onDismiss={() => setSuccessModal(false)}
      />

      <Modal
        visible={!!errorModal}
        title="요청 실패"
        body={errorModal ?? ''}
        variant="error"
        confirmLabel="확인"
        onConfirm={() => setErrorModal(null)}
        onDismiss={() => setErrorModal(null)}
      />
    </View>
  );
}
