import { useCallback, useState } from 'react';
import { Animated, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Button from '@/components/Button';
import { Chip } from '@/components/Chip';
import { SubHeader } from '@/components/SubHeader';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import BingoPreview from '@/components/BingoPreview';
import { fetchThemes, getThemeName, type BingoThemeConfig } from '@/features/bingo/lib/theme';
import {
  fetchFavoriteThemeIds,
  fetchThemeFavoriteCounts,
  queueAppliedTheme,
  setThemeFavorite,
} from '@/features/bingo/lib/theme-interactions';
import type { BingoData } from '@/types/bingo';
import StarOn from '@/assets/icons/ic_star_on.svg';
import StarOff from '@/assets/icons/ic_star_off.svg';
import { FIXED } from '@/lib/use-colors';

const examples = [
  '여행 가기',
  '책 읽기',
  '운동하기',
  '친구 만나기',
  '새로운 음식 먹기',
  '사진 찍기',
  '산책하기',
  '영화 보기',
  '일기 쓰기',
  '취미 배우기',
  '요리하기',
  '휴식하기',
  '공연 보기',
  '도전하기',
  '추억 만들기',
  '목표 이루기',
];

export default function ThemeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState<BingoThemeConfig | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [grid, setGrid] = useState<'3x3' | '4x3' | '4x4'>('3x3');
  const [title, setTitle] = useState('나의 빙고');
  const [cells, setCells] = useState<string[]>(examples);
  const [message, setMessage] = useState('');
  const [burst, setBurst] = useState(false);
  const [burstProgress] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([fetchThemes(), fetchFavoriteThemeIds(), fetchThemeFavoriteCounts()])
        .then(([map, ids, counts]) => {
          if (active) {
            setTheme(map[id] ?? null);
            setFavorite(ids.has(id));
            setFavoriteCount(counts[id] ?? 0);
          }
        })
        .catch(() => {
          if (active) setMessage('테마를 불러오지 못했습니다.');
        });
      return () => {
        active = false;
      };
    }, [id]),
  );

  const toggleFavorite = async () => {
    if (!theme) return;
    const next = !favorite;
    setFavorite(next);
    setFavoriteCount((count) => Math.max(0, count + (next ? 1 : -1)));
    if (next) {
      burstProgress.setValue(0);
      setBurst(true);
      Animated.timing(burstProgress, { toValue: 1, duration: 600, useNativeDriver: true }).start(
        () => setBurst(false),
      );
    }
    try {
      await setThemeFavorite(theme.id, next);
    } catch {
      setFavorite(!next);
      setFavoriteCount((count) => Math.max(0, count + (next ? -1 : 1)));
      setMessage('즐겨찾기를 변경하지 못했습니다.');
    }
  };
  const count = grid === '3x3' ? 9 : grid === '4x3' ? 12 : 16;
  const bingo: BingoData = {
    id: 'theme-preview',
    title,
    grid,
    cells: cells.slice(0, count),
    maxEdits: 0,
    achievedCount: 0,
    bingoCount: 0,
    dday: 0,
    startDate: null,
    targetDate: null,
    state: 'draft',
    theme: id,
    retrospective: null,
  };

  return (
    <View className="flex-1 bg-surface">
      <SubHeader
        title={theme ? getThemeName(theme, i18n.language) : '테마'}
        right={
          theme && (
            <Pressable
              onPress={() => void toggleFavorite()}
              accessibilityLabel={favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              accessibilityHint={`즐겨찾기 ${favoriteCount}개`}
              className="relative p-2"
            >
              {favorite ? (
                <StarOn width={26} height={26} className="text-green-500" />
              ) : (
                <StarOff width={26} height={26} className="text-gray-700" />
              )}
              {/* <Text className="text-caption-sm text-gray-700">{favoriteCount}</Text> */}
              {burst &&
                Array.from({ length: 10 }, (_, i) => {
                  const angle = (i * Math.PI) / 5;
                  return (
                    <Animated.View
                      key={i}
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 18,
                        left: 18,
                        width: 3,
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: FIXED.particle[i % FIXED.particle.length],
                        opacity: burstProgress.interpolate({
                          inputRange: [0, 0.4, 1],
                          outputRange: [1, 1, 0],
                        }),
                        transform: [
                          {
                            translateX: burstProgress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, Math.cos(angle) * 18],
                            }),
                          },
                          {
                            translateY: burstProgress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, Math.sin(angle) * 18 + 8],
                            }),
                          },
                        ],
                      }}
                    />
                  );
                })}
            </Pressable>
          )
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32, gap: 16 }}>
        {theme ? (
          <>
            <BingoPreview bingo={bingo} size="md" />
            <View className="flex-row justify-center gap-2">
              {(['3x3', '4x3', '4x4'] as const).map((g) => (
                <Chip key={g} label={g} selected={grid === g} onPress={() => setGrid(g)} />
              ))}
            </View>
            <View className="gap-2 px-4">
              <Text className="text-label-md text-gray-800">미리보기 제목</Text>
              <TextInput value={title} onChangeText={setTitle} maxLength={80} />
            </View>
            <Text className="px-4 text-label-md text-gray-800">
              칸 내용을 수정해 미리 볼 수 있어요
            </Text>
            <View className="gap-2 px-4">
              {Array.from({ length: count }, (_, i) => (
                <TextInput
                  key={i}
                  value={cells[i] ?? ''}
                  onChangeText={(value) =>
                    setCells((before) => {
                      const next = [...before];
                      next[i] = value;
                      return next;
                    })
                  }
                  maxLength={100}
                />
              ))}
            </View>
            <View className="px-4">
              <Button
                label="빙고에 바로 적용하기"
                onClick={() => {
                  queueAppliedTheme(theme.id);
                  router.dismiss(2);
                }}
              />
            </View>
          </>
        ) : (
          <Text className="px-4 text-gray-600">테마를 찾을 수 없습니다.</Text>
        )}
        {!!message && <Text className="px-4 text-caption-sm text-gray-600">{message}</Text>}
      </ScrollView>
    </View>
  );
}
