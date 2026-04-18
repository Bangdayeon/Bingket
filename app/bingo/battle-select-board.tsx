import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import IconButton from '@/components/IconButton';
import { Modal } from '@/components/Modal';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import CheckIcon from '@/assets/icons/ic_check.svg';
import { fetchMyBingos, type FetchedBingo } from '@/features/bingo/lib/bingo';
import {
  setSelectedBoardId,
  setSelectedBoardTitle,
  getSelectedRequestId,
  clearSelectedRequestId,
} from '@/features/battle/lib/battle-selection';
import { acceptBattleRequest, fetchMyBattles } from '@/features/battle/lib/battle';
import BingoPreview from '@/components/BingoPreview';
import Button from '@/components/Button';
import MascotSad from '@/assets/mascots/mascot_sad.svg';
import Loading from '@/components/Loading';

export default function BattleSelectBoardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // mode=accept: called from BingoBattle to accept an incoming request
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isAcceptMode = mode === 'accept';

  const [bingos, setBingos] = useState<FetchedBingo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allBingos, setAllBingos] = useState<FetchedBingo[]>([]);

  useEffect(() => {
    Promise.all([fetchMyBingos(), fetchMyBattles()])
      .then(([allBingos, battles]) => {
        const battlingBoardIds = new Set(battles.flatMap((b) => [b.myBoardId].filter(Boolean)));
        setAllBingos(allBingos);
        setBingos(allBingos.filter((fb) => !battlingBoardIds.has(fb.bingo.id)));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async () => {
    if (!selectedId) return;
    const selected = bingos.find((b) => b.bingo.id === selectedId);

    if (isAcceptMode) {
      const requestId = getSelectedRequestId();
      if (!requestId) {
        setErrorMessage('요청 정보를 찾을 수 없어요.');
        return;
      }
      setAccepting(true);
      try {
        await acceptBattleRequest({ requestId, receiverBoardId: selectedId });
        clearSelectedRequestId();
        router.back();
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : '수락에 실패했어요.');
      } finally {
        setAccepting(false);
      }
    } else {
      setSelectedBoardId(selectedId);
      setSelectedBoardTitle(selected?.bingo.title ?? null);
      router.back();
    }
  };

  const renderItem = ({ item }: { item: FetchedBingo }) => {
    const { bingo } = item;
    const isSelected = selectedId === bingo.id;

    return (
      <Pressable
        onPress={() => setSelectedId(bingo.id)}
        className={`m-5 p-4 rounded-2xl border-2 ${
          isSelected ? 'border-green-400 bg-green-50   ' : 'border-gray-200   bg-white  '
        }`}
      >
        <View className="flex items-center gap-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 w-full">
              <Text className="text-title-sm mb-1">{bingo.title}</Text>
              {bingo.targetDate ? (
                <Text className="text-caption-sm text-gray-500  ">종료일: {bingo.targetDate}</Text>
              ) : null}
              <Text className="text-caption-sm text-gray-500   mt-1">
                {bingo.achievedCount}/{bingo.cells.length} 달성 · 빙고 {bingo.bingoCount}
              </Text>
            </View>
            {isSelected ? (
              <CheckIcon width={32} height={32} color="#4ADE80" /* green-400 */ />
            ) : null}
          </View>
          <BingoPreview bingo={bingo} />
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white  " style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300  ">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">
          {isAcceptMode ? '대결에 사용할 빙고 선택' : '내 빙고 선택'}
        </Text>
        <Pressable
          onPress={handleConfirm}
          disabled={!selectedId || accepting}
          className={selectedId && !accepting ? '' : 'opacity-40'}
        >
          <Text className="font-semibold text-green-500">{isAcceptMode ? '수락' : '확인'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading color="#6ADE50" />
        </View>
      ) : bingos.length === 0 ? (
        allBingos.length >= 3 ? (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            <MascotSad width={200} height={200} />
            <Text className="text-body-md text-center leading-7">
              이미 모든 빙고가 대결중이에요.😢{'\n'}
              다른 빙고의 대결을 취소하거나,{'\n'}
              이번 대결은 다음으로 미뤄야해요.
            </Text>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            <Text className="text-body-md text-center">
              대결할 수 있는 빙고가 없어요.{'\n'}빙고를 만들어 볼까요?
            </Text>
            <Button
              className="px-6"
              label="빙고 만들러 가기"
              onClick={() => router.push('/bingo/add')}
            />
          </View>
        )
      ) : (
        <FlatList
          data={bingos}
          keyExtractor={(item) => item.bingo.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 16 }}
        />
      )}

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
