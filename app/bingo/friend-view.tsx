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

/**
 * 타인 빙고판 열람 (읽기 전용).
 * 달성 현황과 진행 기간까지 보여주되 메모와 회고는 RPC 응답에 아예 포함되지 않는다.
 * 제목은 헤더가 아니라 빙고판 위에만 둔다 — 같은 제목이 두 번 나오지 않게.
 */
export default function FriendBingoViewScreen() {
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
        // 권한 문제와 네트워크 실패는 다른 상황이다. 같은 문구로 뭉뚱그리지 않는다.
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
    // cells 는 position 순으로 정렬돼 오지만 빠진 칸이 있을 수 있어 격자 크기에 맞춰 채운다
    const checked = Array.from({ length: cols * rows }, (_, i) => b.cells[i]?.isChecked ?? false);
    const achieved = checked.filter(Boolean).length;
    const { elapsed, total, formatted } = getBingoPeriod(b.startDate, b.targetDate);
    // 끝난 빙고에 남은 기간을 보여줄 이유가 없다. 진행 기간은 아래 날짜 줄에 남는다.
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

        {/* 항목이 둘로 줄면 justify-between 은 양 끝으로 벌어져 허전해진다 */}
        <View
          className={`mt-6 flex-row px-10 ${showDeadline ? 'justify-between' : 'justify-around'}`}
        >
          <BingoStat label="달성" current={achieved} total={cols * rows} />
          <BingoStat
            label="빙고"
            current={calcBingoCount(checked, cols, rows)}
            total={calcMaxBingo(cols, rows)}
          />
          {showDeadline && <BingoStat label="종료일" current={elapsed} total={total} />}
        </View>

        {formatted ? (
          <Text className="mt-8 px-4 text-caption-sm text-gray-700">{formatted}</Text>
        ) : null}
      </>
    );
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* 제목은 빙고판 위에만 둔다 — 헤더에도 넣으면 같은 제목이 두 번 나온다 */}
      <PageHeader />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      ) : loadFailed ? (
        <ErrorState onRetry={() => void load()} />
      ) : !board ? (
        <EmptyState message="볼 수 없는 빙고예요." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {renderBoard(board)}
        </ScrollView>
      )}
    </View>
  );
}
