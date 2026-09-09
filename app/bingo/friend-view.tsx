import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { BingoThumbnail } from '@/features/profile/components/BingoThumbnail';
import { fetchBoardDetail, type BoardDetail } from '@/features/profile/lib/profile';
import { useResponsive } from '@/lib/use-responsive';

/**
 * 타인 빙고판 열람 (읽기 전용).
 * 메모와 회고는 RPC 응답에 아예 포함되지 않는다 — 빙고판과 체크 여부만 보여준다.
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

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title={board?.title ?? ''} />

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
          <View className="items-center pt-4">
            <BingoThumbnail
              width={contentWidth}
              grid={board.grid}
              theme={board.theme}
              title={board.title}
              cells={board.cells}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
