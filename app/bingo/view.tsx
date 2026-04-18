import * as Sentry from '@sentry/react-native';
import { BingoCard } from '@/features/bingo/components/BingoCard';
import { BingoCellModal } from '@/features/bingo/BingoCellModal';
import {
  fetchBingoForView,
  updateCell,
  updateRetrospective,
  calcBingoCount,
} from '@/features/bingo/lib/bingo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from '@/components/IconButton';
import { Text } from '@/components/Text';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import ProgressIcon from '@/assets/icons/ic_progress.svg';
import DoneIcon from '@/assets/icons/ic_done.svg';
import type { FetchedBingo } from '@/features/bingo/lib/bingo';
import type { BingoCellDetail } from '@/types/bingo-cell';
import { fetchBattleByBoardId } from '@/features/battle/lib/battle';
import Loading from '@/components/Loading';

export default function BingoViewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bingoId } = useLocalSearchParams<{ bingoId: string }>();

  const [data, setData] = useState<FetchedBingo | null>(null);
  const [cellDetails, setCellDetails] = useState<BingoCellDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<number | null>(null);
  const [retrospective, setRetrospective] = useState('');
  const memoDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const retroDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bingoId) return;
    fetchBingoForView(bingoId).then((result) => {
      setData(result);
      if (result) {
        setCellDetails(result.cellDetails);
        setRetrospective(result.bingo.retrospective ?? '');
      }
      setLoading(false);
    });
    fetchBattleByBoardId(bingoId).then((res) => {
      if (res) setBattleId(res.battleId);
    });
  }, [bingoId]);

  const handleCellUpdate = (
    cellId: string,
    updates: Partial<Pick<BingoCellDetail, 'completed' | 'completedAt' | 'memo'>>,
  ) => {
    setCellDetails((prev) => prev.map((c) => (c.id === cellId ? { ...c, ...updates } : c)));

    const { memo, ...nonMemoUpdates } = updates;
    if (Object.keys(nonMemoUpdates).length > 0) {
      updateCell(cellId, nonMemoUpdates).catch(Sentry.captureException);
    }
    if (memo !== undefined) {
      clearTimeout(memoDebounceRef.current[cellId]);
      memoDebounceRef.current[cellId] = setTimeout(() => {
        updateCell(cellId, { memo }).catch(Sentry.captureException);
      }, 500);
    }
  };

  const handleRetrospectiveChange = (text: string) => {
    setRetrospective(text);
    if (retroDebounceRef.current) clearTimeout(retroDebounceRef.current);
    retroDebounceRef.current = setTimeout(() => {
      updateRetrospective(bingoId, text).catch(Sentry.captureException);
    }, 500);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white  ">
        <Loading color="#6ADE50" />
      </View>
    );
  }

  if (!data) return null;

  const { bingo } = data;
  const isDone = bingo.state === 'done';
  const completedCells = cellDetails.map((c) => c.completed);

  const [cols, rows] = bingo.grid.split('x').map(Number);
  const liveBingo = {
    ...bingo,
    achievedCount: completedCells.filter(Boolean).length,
    bingoCount: calcBingoCount(completedCells, cols, rows),
  };

  return (
    <View className="flex-1 bg-white  " style={{ paddingTop: insets.top }}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-200  ">
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

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <BingoCard
          bingo={liveBingo}
          completedCells={completedCells}
          onCellPress={(index) => setModalTarget(index)}
          onEditPress={
            isDone
              ? undefined
              : () => router.push({ pathname: '/bingo/modify', params: { bingoId: bingo.id } })
          }
          hasBattle={!!battleId}
          onBattlePress={
            isDone
              ? undefined
              : battleId
                ? () => router.push({ pathname: '/bingo/battle-status', params: { battleId } })
                : () => router.push({ pathname: '/bingo/battle', params: { bingoId: bingo.id } })
          }
        />

        {isDone && (
          <View className="px-5 mt-2">
            <Text className="text-title-md mb-2">회고</Text>
            <TextInput
              value={retrospective}
              onChangeText={handleRetrospectiveChange}
              placeholder="이 빙고를 돌아보며 한 마디 남겨보세요."
              placeholderTextColor="#B4BBBB" /* gray-400 */
              multiline
              maxLength={500}
              textAlignVertical="top"
              style={{
                minHeight: 100,
                backgroundColor: '#F6F7F7' /* gray-100 */,
                borderRadius: 20,
                padding: 16,
                lineHeight: 20,
                color: '#181C1C' /* gray-900 */,
              }}
            />
            <Text className="text-caption-sm text-gray-400 text-right mt-1">
              {retrospective.length}/500
            </Text>
          </View>
        )}
      </ScrollView>

      <BingoCellModal
        visible={modalTarget !== null}
        cells={cellDetails}
        initialIndex={modalTarget ?? 0}
        onClose={() => setModalTarget(null)}
        onUpdate={handleCellUpdate}
        readOnly={isDone}
      />
    </View>
  );
}
