import { BingoCard } from '@/features/bingo/components/BingoCard';
import { fetchBingoForView } from '@/features/bingo/lib/bingo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import ProgressIcon from '@/assets/icons/ic_progress.svg';
import DoneIcon from '@/assets/icons/ic_done.svg';
import type { FetchedBingo } from '@/features/bingo/lib/bingo';

export default function BingoViewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bingoId } = useLocalSearchParams<{ bingoId: string }>();

  const [data, setData] = useState<FetchedBingo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bingoId) return;
    fetchBingoForView(bingoId).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [bingoId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) return null;

  const { bingo, cellDetails } = data;
  const isDone = bingo.state === 'done';
  const completedCells = cellDetails.map((c) => c.completed);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <View className="flex-1 flex-row items-center justify-center gap-2">
          {isDone ? (
            <DoneIcon width={20} height={20} color="#48BE30" /* green-600 */ />
          ) : (
            <ProgressIcon width={20} height={20} />
          )}
          <Text className="text-title-sm">{bingo.title}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 40 }}
      >
        <BingoCard
          bingo={bingo}
          completedCells={completedCells}
          onCellPress={() => {}}
          onEditPress={
            isDone
              ? undefined
              : () => router.push({ pathname: '/bingo/modify', params: { bingoId: bingo.id } })
          }
        />
      </ScrollView>
    </View>
  );
}
