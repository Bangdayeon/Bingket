import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import DoneIcon from '@/assets/icons/ic_done.svg';
import DraftIcon from '@/assets/icons/ic_draft.svg';
import ProgressIcon from '@/assets/icons/ic_progress.svg';

interface BingoItem {
  id: string;
  title: string;
}

const MOCK_IN_PROGRESS: BingoItem[] = [
  { id: '1', title: '빙고 제목1' },
  { id: '2', title: '빙고 제목2' },
];

const MOCK_COMPLETED: BingoItem[] = [
  { id: '3', title: '2학년 2학기' },
  { id: '4', title: '2025' },
];

const SECTION_ICONS = {
  draft: <DraftIcon />,
  progress: <ProgressIcon />,
  done: <DoneIcon />,
};

function BingoRow({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between px-5 py-3">
      <Text className="text-title-sm text-gray-900">{title}</Text>
      <Text style={{ fontSize: 18, color: '#4C5252' }}>{'›'}</Text>
    </Pressable>
  );
}

function Section({
  type,
  label,
  items,
  onItemPress,
}: {
  type: 'draft' | 'progress' | 'done';
  label: string;
  items: BingoItem[];
  onItemPress: (item: BingoItem) => void;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 px-5 py-3">
        {SECTION_ICONS[type]}
        <Text className="text-title-md text-gray-900">{label}</Text>
      </View>
      {items.map((item) => (
        <BingoRow key={item.id} title={item.title} onPress={() => onItemPress(item)} />
      ))}
    </View>
  );
}

export default function RecordTab() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<BingoItem[]>([]);

  const loadDraft = useCallback(() => {
    AsyncStorage.getItem('bingo_draft').then((raw) => {
      if (!raw) {
        setDrafts([]);
        return;
      }
      const data = JSON.parse(raw);
      if (data?.title) setDrafts([{ id: 'draft_0', title: data.title }]);
      else setDrafts([]);
    });
  }, []);

  useFocusEffect(loadDraft);

  return (
    <ScrollView className="flex-1">
      <Section
        type="draft"
        label="제작 중"
        items={drafts}
        onItemPress={() => router.push({ pathname: '/bingo-add', params: { loadDraft: 'true' } })}
      />
      <Section
        type="progress"
        label="진행 중"
        items={MOCK_IN_PROGRESS}
        onItemPress={() => router.push('/bingo-modify')}
      />
      <Section
        type="done"
        label="완료"
        items={MOCK_COMPLETED}
        onItemPress={() => router.push('/bingo-modify')}
      />
    </ScrollView>
  );
}
