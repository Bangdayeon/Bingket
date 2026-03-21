import { ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BingoCard } from './components/BingoCard';
import { BingoCellModal } from './BingoCellModal';
import { Text } from '@/components/Text';
import AddIcon from '@/assets/icons/ic_add.svg';
import { BingoData } from '@/types/bingo';
import { BingoCellDetail } from '@/types/bingo-cell';
import { MOCK_BINGOS } from '@/mocks/bingo';

const MAX_BINGOS = 3;

function calcDday(endDate: string | null): number {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function initCellDetails(bingo: BingoData): BingoCellDetail[] {
  return bingo.cells.map((title, i) => ({
    id: `${bingo.id}_cell${i}`,
    title,
    completed: false,
    completedAt: null,
    memo: '',
  }));
}

export function BingoAll() {
  const router = useRouter();
  const [draftBingo, setDraftBingo] = useState<BingoData | null>(null);
  const [cellDetails, setCellDetails] = useState<Record<string, BingoCellDetail[]>>({});
  const [modalTarget, setModalTarget] = useState<{ bingoId: string; cellIndex: number } | null>(
    null,
  );

  const loadDraft = useCallback(() => {
    AsyncStorage.getItem('@bingkit/draft-bingo').then((raw) => {
      if (!raw) {
        setDraftBingo(null);
        return;
      }
      const data = JSON.parse(raw);
      if (!data?.title) {
        setDraftBingo(null);
        return;
      }
      const grid = data.selectedGrid ?? '3x3';
      const [cols, rows] = grid.split('x').map(Number);
      setDraftBingo({
        id: 'draft_0',
        title: data.title,
        grid,
        cells: data.cells ?? Array(cols * rows).fill(''),
        maxEdits: parseInt(data.selectedEditCount) || 3,
        achievedCount: 0,
        bingoCount: 0,
        dday: calcDday(data.endDate),
        state: data.state,
      });
    });
  }, []);

  useFocusEffect(loadDraft);

  const bingos: BingoData[] = [...(draftBingo ? [draftBingo] : []), ...MOCK_BINGOS]
    .filter((b) => b.state === 'progress')
    .slice(0, MAX_BINGOS);

  const handleCellPress = (bingo: BingoData, cellIndex: number) => {
    if (!cellDetails[bingo.id]) {
      setCellDetails((prev) => ({ ...prev, [bingo.id]: initCellDetails(bingo) }));
    }
    setModalTarget({ bingoId: bingo.id, cellIndex });
  };

  const handleCellUpdate = (
    cellId: string,
    updates: Partial<Pick<BingoCellDetail, 'completed' | 'completedAt' | 'memo'>>,
  ) => {
    if (!modalTarget) return;
    setCellDetails((prev) => ({
      ...prev,
      [modalTarget.bingoId]: (prev[modalTarget.bingoId] ?? []).map((cell) =>
        cell.id === cellId ? { ...cell, ...updates } : cell,
      ),
    }));
  };

  const modalCells = modalTarget ? (cellDetails[modalTarget.bingoId] ?? []) : [];

  return (
    <ScrollView className="flex-1 mt-[80px] bg-white px-5 dark:bg-gray-900 mb-20">
      {bingos.map((bingo) => (
        <BingoCard
          key={bingo.id}
          bingo={bingo}
          completedCells={cellDetails[bingo.id]?.map((c) => c.completed)}
          onCellPress={(cellIndex) => handleCellPress(bingo, cellIndex)}
          onEditPress={() =>
            bingo.id === 'draft_0'
              ? router.push({ pathname: '/bingo/add', params: { loadDraft: 'true' } })
              : router.push({ pathname: '/bingo/modify', params: { bingoId: bingo.id } })
          }
        />
      ))}

      {/* 새 빙고 추가 섹션 */}
      {bingos.length < MAX_BINGOS && (
        <Pressable
          onPress={() => router.push('/bingo/add')}
          className="items-center justify-center gap-3 bg-green-100 w-full h-[230px] rounded-[20px] mt-2"
        >
          <AddIcon width={40} height={40} color="#4C5252" /* gray-700 */ />
          <Text className="text-title-md" style={{ color: '#4C5252' /* gray-700 */ }}>
            ({bingos.length}/{MAX_BINGOS})
          </Text>
        </Pressable>
      )}

      <BingoCellModal
        visible={!!modalTarget}
        cells={modalCells}
        initialIndex={modalTarget?.cellIndex ?? 0}
        onClose={() => setModalTarget(null)}
        onUpdate={handleCellUpdate}
      />
    </ScrollView>
  );
}
