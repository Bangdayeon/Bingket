import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { Text } from '@/components/Text';
import Loading from '@/components/Loading';
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

  useFocusEffect(
    useCallback(() => {
      if (!boardId) return;
      let cancelled = false;
      setLoading(true);
      fetchBoardDetail(boardId)
        .then((b) => {
          if (!cancelled) setBoard(b);
        })
        .catch(Sentry.captureException)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [boardId]),
  );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title={board?.title ?? ''} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      ) : !board ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body-md text-gray-400 text-center">{'볼 수 없는 빙고예요.'}</Text>
        </View>
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
