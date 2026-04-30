import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import ForwardArrowIcon from '@/assets/icons/ic_arrow_forward.svg';
import { sendBattleRequest, type Friend } from '@/features/battle/lib/battle';
import { fetchBingoForView, fetchMyBingos } from '@/features/bingo/lib/bingo';
import BingoPreview from '@/components/BingoPreview';
import type { BingoData } from '@/types/bingo';
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
import { Information } from '@/components/Information';
import { useMyProfile } from '@/features/mypage/use-my-profile';

const TOTAL_STEPS = 5;

export default function BattleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    bingoId: bingoIdParam,
    bingoTitle: bingoTitleParam,
    fromFriend: fromFriendParam,
  } = useLocalSearchParams<{
    bingoId?: string;
    bingoTitle?: string;
    fromFriend?: string;
  }>();
  const fromBingo = !!bingoIdParam;
  const fromFriend = fromFriendParam === 'true';

  const myProfile = useMyProfile();
  const [step, setStep] = useState(1);
  const [betName, setBetName] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(bingoIdParam ?? null);
  const [selectedBingo, setSelectedBingo] = useState<BingoData | null>(null);
  const [bingoTitle, setBingoTitle] = useState<string | null>(bingoTitleParam ?? null);
  const [bingoCount, setBingoCount] = useState<number | null>(null);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [betText, setBetText] = useState('');
  const [sending, setSending] = useState(false);

  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    if (fromBingo) return;
    fetchMyBingos().then((list) => setBingoCount(list.length));
  }, [fromBingo]);

  useEffect(() => {
    if (!selectedBoardId) {
      setSelectedBingo(null);
      return;
    }
    fetchBingoForView(selectedBoardId).then((result) => {
      if (result) setSelectedBingo(result.bingo);
    });
  }, [selectedBoardId]);

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

  const canAdvance = (() => {
    switch (step) {
      case 1:
        return betName.trim().length > 0;
      case 2:
        return !!selectedBoardId;
      case 3:
        return !!friend;
      case 4:
        return betText.trim().length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  })();

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const handleSend = async () => {
    if (!selectedBoardId || !friend) return;

    setSending(true);
    try {
      await sendBattleRequest({
        senderBoardId: selectedBoardId,
        receiverId: friend.friendId,
        title: betName,
        betText,
      });
      setSuccessModal(true);
    } catch (e) {
      setErrorModal(e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={handleBack}
        />
        <Text className="flex-1 text-center text-title-sm">친구와 대결하기</Text>
        <Information content="한 빙고당 한 명의 친구와 대결을 할 수 있어요." />
      </View>

      {/* Step indicators */}
      {step !== 5 && (
        <View className="flex-row items-center justify-center gap-3 py-6">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
            <View
              key={n}
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: n === step ? '#6ADE50' : '#E8EAEA' }} /* green / gray-300 */
            >
              <Text
                className="text-caption-sm font-bold"
                style={{ color: n === step ? '#181C1C' : '#6B7280' }} /* white / gray-500 */
              >
                {n}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: 배틀 이름 */}
        {step === 1 && (
          <View className="gap-4">
            <Text className="text-title-md">대결 제목</Text>
            <TextInput
              value={betName}
              onChangeText={(v) => setBetName(v.slice(0, 15))}
              placeholder="대결 제목 (최대 15자)"
              maxLength={15}
            />
            <Text className="text-title-md mt-8">대결 기간</Text>
            <View className="flex gap-1">
              <Text className="text-body-sm text-gray-800">
                {'두 사람 중 기간이 더 짧은 빙고의 기간으로 설정돼요!'}
              </Text>
              <Text className="text-body-sm text-gray-800">
                {'친구와 미리 기간을 맞추면 더 재밌게 할 수 있을거예요😊'}
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: 빙고 선택 */}
        {step === 2 && (
          <View className="gap-3">
            {fromBingo ? (
              <Text className="text-title-md mb-1">대결에 사용할 빙고를 확인주세요</Text>
            ) : (
              <>
                <Text className="text-title-md mb-1">대결에 사용할 빙고를 골라주세요</Text>
                <Pressable
                  className="flex-row items-center justify-between py-3 px-4 bg-gray-100 rounded-xl"
                  onPress={() => router.push('/bingo/battle-select-board')}
                >
                  <Text className="text-body-md">기존 빙고 중에서 선택할래요</Text>
                  <ForwardArrowIcon width={20} height={20} color="#2E3333" /* gray-800 */ />
                </Pressable>
                {(bingoCount === null || bingoCount < 3) && (
                  <Pressable
                    className="flex-row items-center justify-between py-3 px-4 bg-gray-100 rounded-xl"
                    onPress={() =>
                      router.push({ pathname: '/bingo/add', params: { fromBattle: 'true' } })
                    }
                  >
                    <Text className="text-body-md">새로운 빙고를 만들래요</Text>
                    <ForwardArrowIcon width={20} height={20} color="#2E3333" /* gray-800 */ />
                  </Pressable>
                )}
              </>
            )}
            {selectedBingo && (
              <BingoPreview bingo={selectedBingo} size="md" className="w-full mt-2" />
            )}
          </View>
        )}

        {/* Step 3: 친구 선택 */}
        {step === 3 && (
          <View className="gap-3">
            {fromFriend ? (
              <>
                <Text className="text-title-md mb-1">대결을 신청할 친구를 확인주세요</Text>
                <View className="flex-row gap-2 items-center">
                  {friend && <ProfileAvatar size={28} avatarUrl={friend.avatarUrl} />}
                  <Text className="text-body-md">
                    {friend ? friend.displayName : '친구 선택하기'}
                  </Text>
                  {friend && (
                    <Text className="text-caption-sm text-gray-500">@{friend.username}</Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <Text className="text-title-md mb-1">대결을 신청할 친구를 골라주세요</Text>
                <Pressable
                  className="flex-row items-center justify-between py-3 px-4 bg-gray-100 rounded-xl"
                  onPress={() =>
                    router.push({ pathname: '/mypage/friend-list', params: { mode: 'select' } })
                  }
                >
                  <View className="flex-row gap-2 items-center">
                    {friend && <ProfileAvatar size={28} avatarUrl={friend.avatarUrl} />}
                    <Text className="text-body-md">
                      {friend ? friend.displayName : '친구 선택하기'}
                    </Text>
                    {friend && (
                      <Text className="text-caption-sm text-gray-500">@{friend.username}</Text>
                    )}
                  </View>
                  <ForwardArrowIcon width={20} height={20} />
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Step 4: 내기 내용 */}
        {step === 4 && (
          <View className="gap-3">
            <Text className="text-title-md mb-1">내기 내용을 작성해주세요</Text>
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
        )}

        {/* Step 5: 마지막 확인 */}
        {step === 5 && (
          <View className="mt-6">
            <View className="flex items-center justify-center gap-2 bg-blue-100 py-5 rounded-3xl">
              <Text className="text-title-md font-pretendard-semibold">&lt; {bingoTitle} &gt;</Text>
              <View className="flex-row gap-8 items-center">
                <View className="flex justify-center items-center gap-1">
                  <ProfileAvatar size={40} avatarUrl={myProfile?.avatarUrl ?? null} />
                  <Text className="text-caption-sm text-gray-800">나</Text>
                </View>
                <Text className="font-pretendard-semibold pb-1">VS</Text>
                {friend && (
                  <View className="flex justify-center items-center gap-1">
                    <ProfileAvatar size={40} avatarUrl={friend.avatarUrl} />
                    <Text className="text-caption-sm text-gray-800">{friend.displayName}</Text>
                  </View>
                )}
              </View>
              <View className="flex-row gap-6">
                {selectedBingo && (
                  <BingoPreview
                    bingo={selectedBingo}
                    className="w-[40%] mt-2  rounded-2xl overflow-hidden"
                  />
                )}
                <View className="items-center justify-center flex bg-blue-400 mt-2 w-[40%] rounded-2xl">
                  <Text className="text-[30px]">?</Text>
                </View>
              </View>
              <View className="w-full items-center px-5 gap-3 mt-10">
                <Text className="text-title-md font-pretendard-semibold">내기 내용</Text>
                <View className="bg-white w-full px-4 py-3 rounded-lg">
                  <Text>{betText}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View className="py-6 px-8">
        {step < TOTAL_STEPS ? (
          <Button label="다음" onClick={() => setStep((prev) => prev + 1)} disabled={!canAdvance} />
        ) : (
          <Button
            label="대결 요청 보내기"
            onClick={handleSend}
            disabled={!canAdvance}
            loading={sending}
          />
        )}
      </View>

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
