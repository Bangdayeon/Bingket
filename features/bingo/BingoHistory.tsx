import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View, useColorScheme } from 'react-native';
import { Text } from '@/components/Text';
import DoneIcon from '@/assets/icons/ic_done.svg';
import DraftIcon from '@/assets/icons/ic_draft.svg';
import ProgressIcon from '@/assets/icons/ic_progress.svg';
import ForwardArrowIcon from '@/assets/icons/ic_arrow_forward.svg';
import { fetchMyBingos, fetchMyCompletedBingos } from '@/features/bingo/lib/bingo';

interface BingoItem {
  id: string;
  title: string;
}

function Section({
  icon,
  label,
  items,
  onItemPress,
}: {
  icon: React.ReactNode;
  label: string;
  items: BingoItem[];
  onItemPress: (item: BingoItem) => void;
}) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#F6F7F7' : '#181C1C'; /* gray-100 : gray-900 */

  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 py-3">
        {icon}
        <Text className="text-title-md">{label}</Text>
      </View>
      {items.length === 0 && (
        <Text className="text-body-sm text-gray-400 dark:text-gray-500 py-2">없음</Text>
      )}
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onItemPress(item)}
          className="flex-row items-center justify-between py-3"
        >
          <Text className="text-title-sm">{item.title}</Text>
          <ForwardArrowIcon width={20} height={20} color={iconColor} />
        </Pressable>
      ))}
    </View>
  );
}

export function BingoHistory() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<BingoItem[]>([]);
  const [inProgress, setInProgress] = useState<BingoItem[]>([]);
  const [done, setDone] = useState<BingoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      AsyncStorage.getItem('@bingket/draft-bingo'),
      fetchMyBingos(),
      fetchMyCompletedBingos(),
    ]).then(([raw, progress, completed]) => {
      const draft = raw ? JSON.parse(raw) : null;
      setDrafts(draft?.title ? [{ id: 'draft_0', title: draft.title }] : []);
      setInProgress(progress.map(({ bingo }) => ({ id: bingo.id, title: bingo.title })));
      setDone(completed.map(({ bingo }) => ({ id: bingo.id, title: bingo.title })));
      setLoading(false);
    });
  }, []);

  useFocusEffect(loadData);

  if (loading) {
    return (
      <View className="flex-1 mt-[80px] items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 mt-[80px] bg-white px-5 dark:bg-gray-900 mb-20">
      <Section
        icon={<DraftIcon />}
        label="제작 중"
        items={drafts}
        onItemPress={() => router.push({ pathname: '/bingo/add', params: { loadDraft: 'true' } })}
      />
      <Section
        icon={<ProgressIcon />}
        label="진행 중"
        items={inProgress}
        onItemPress={(item) =>
          router.push({ pathname: '/bingo/view', params: { bingoId: item.id } })
        }
      />
      <Section
        icon={<DoneIcon color="#48BE30" /* green-600 */ />}
        label="완료"
        items={done}
        onItemPress={(item) =>
          router.push({ pathname: '/bingo/view', params: { bingoId: item.id } })
        }
      />
    </ScrollView>
  );
}
