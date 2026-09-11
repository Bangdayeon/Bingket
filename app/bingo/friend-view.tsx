import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { Text } from '@/components/Text';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { BingoThumbnail } from '@/features/profile/components/BingoThumbnail';
import { BingoStat } from '@/features/bingo/components/BingoStat';
import { fetchBoardDetail, type BoardDetail } from '@/features/profile/lib/profile';
import { calcBingoCount } from '@/features/bingo/lib/bingo';
import { calcMaxBingo } from '@/lib/calcMaxBingo';
import { getBingoPeriod } from '@/lib/bingo-period';
import { useResponsive } from '@/lib/use-responsive';
import { useTranslation } from 'react-i18next';

export default function FriendBingoViewScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();
  const { boardId } = useLocalSearchParams<{ boardId: string }>();

  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    if (!boardId) return;
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    fetchBoardDetail(boardId)
      .then((b) => {
        if (!cancelled) setBoard(b);
      })
      .catch((e: unknown) => {
        // auth problem and network fail is diffrent
        Sentry.captureException(e);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  useFocusEffect(load);

  const renderBoard = (b: BoardDetail) => {
    const [cols, rows] = b.grid.split('x').map(Number);
    const checked = Array.from({ length: cols * rows }, (_, i) => b.cells[i]?.isChecked ?? false);
    const achieved = checked.filter(Boolean).length;
    const { elapsed, total, formatted } = getBingoPeriod(b.startDate, b.targetDate);
    const showDeadline = b.status === 'progress';

    return (
      <>
        <View className="items-center pt-4">
          <BingoThumbnail
            width={contentWidth}
            grid={b.grid}
            theme={b.theme}
            title={b.title}
            cells={b.cells}
            rounded={false}
          />
        </View>

        <View
          className={`mt-6 flex-row px-10 ${showDeadline ? 'justify-between' : 'justify-around'}`}
        >
          <BingoStat label={t('common.bingo.achieve')} current={achieved} total={cols * rows} />
          <BingoStat
            label={t('common.bingo.bingo')}
            current={calcBingoCount(checked, cols, rows)}
            total={calcMaxBingo(cols, rows)}
          />
          {showDeadline && (
            <BingoStat label={t('common.bingo.endDate')} current={elapsed} total={total} />
          )}
        </View>

        {formatted ? (
          <Text className="mt-8 px-4 text-caption-sm text-gray-700">{formatted}</Text>
        ) : null}
      </>
    );
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      ) : loadFailed ? (
        <ErrorState onRetry={() => void load()} />
      ) : !board ? (
        <EmptyState message={t('common.bingo.emptyBingo')} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {renderBoard(board)}
        </ScrollView>
      )}
    </View>
  );
}
