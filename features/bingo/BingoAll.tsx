import { ScrollView, Pressable, ActivityIndicator, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { BingoCard } from './components/BingoCard';
import { BingoCellModal } from './BingoCellModal';
import { Text } from '@/components/Text';
import AddIcon from '@/assets/icons/ic_add.svg';
import { BingoData } from '@/types/bingo';
import { BingoCellDetail } from '@/types/bingo-cell';
import { fetchMyBingos, updateCell, calcBingoCount } from '@/features/bingo/lib/bingo';

const MAX_BINGOS = 3;

export function BingoAll() {
  const router = useRouter();
  const [bingos, setBingos] = useState<BingoData[]>([]);
  const [cellDetails, setCellDetails] = useState<Record<string, BingoCellDetail[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<{ bingoId: string; cellIndex: number } | null>(
    null,
  );
  const memoDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadData = useCallback(() => {
    setLoading(true);
    fetchMyBingos().then((fetched) => {
      const details: Record<string, BingoCellDetail[]> = {};
      const serverBingos = fetched.map(({ bingo, cellDetails: cd }) => {
        details[bingo.id] = cd;
        return bingo;
      });
      setBingos(serverBingos.slice(0, MAX_BINGOS));
      setCellDetails(details);
      setLoading(false);
    });
  }, []);

  useFocusEffect(loadData);

  const handleCellPress = (bingo: BingoData, cellIndex: number) => {
    setModalTarget({ bingoId: bingo.id, cellIndex });
  };

  const handleCellUpdate = (
    cellId: string,
    updates: Partial<Pick<BingoCellDetail, 'completed' | 'completedAt' | 'memo'>>,
  ) => {
    if (!modalTarget) return;
    const { bingoId } = modalTarget;

    const updatedCells = (cellDetails[bingoId] ?? []).map((cell) =>
      cell.id === cellId ? { ...cell, ...updates } : cell,
    );
    setCellDetails((prev) => ({ ...prev, [bingoId]: updatedCells }));

    // 달성/빙고 수 실시간 재계산
    if ('completed' in updates) {
      const bingo = bingos.find((b) => b.id === bingoId);
      if (bingo) {
        const [cols, rows] = bingo.grid.split('x').map(Number);
        const checked = updatedCells.map((c) => c.completed);
        const newAchievedCount = checked.filter(Boolean).length;
        const newBingoCount = calcBingoCount(checked, cols, rows);
        setBingos((prev) =>
          prev.map((b) =>
            b.id === bingoId
              ? { ...b, achievedCount: newAchievedCount, bingoCount: newBingoCount }
              : b,
          ),
        );
      }
    }

    // DB 저장: memo는 디바운스, 나머지는 즉시
    const { memo, ...nonMemoUpdates } = updates;
    if (Object.keys(nonMemoUpdates).length > 0) {
      updateCell(cellId, nonMemoUpdates).catch(console.error);
    }
    if (memo !== undefined) {
      clearTimeout(memoDebounceRef.current[cellId]);
      memoDebounceRef.current[cellId] = setTimeout(() => {
        updateCell(cellId, { memo }).catch(console.error);
      }, 500);
    }
  };

  const modalCells = modalTarget ? (cellDetails[modalTarget.bingoId] ?? []) : [];

  if (loading) {
    return (
      <View className="flex-1 mt-[50px] items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 mt-[50px] bg-white dark:bg-gray-900 mb-20">
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
      {bingos.length === 0 && (
        <View className="flex items-center mt-32">
          <Text className="text-title-md ">아직 빙고가 없어요</Text>
          <Text className="text-title-md">첫 빙고를 추가해볼까요?</Text>
        </View>
      )}

      {/* 새 빙고 추가 섹션 */}
      {bingos.length < MAX_BINGOS && (
        <View className="px-5 mt-10">
          <Pressable
            onPress={() => router.push('/bingo/add')}
            className="items-center justify-center gap-3 bg-green-100 w-full h-[230px] rounded-[20px]"
          >
            <AddIcon width={40} height={40} color="#4C5252" /* gray-700 */ />
            <Text className="text-title-md" style={{ color: '#4C5252' /* gray-700 */ }}>
              ({bingos.length}/{MAX_BINGOS})
            </Text>
          </Pressable>
        </View>
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
