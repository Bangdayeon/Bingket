import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SubHeader } from '@/components/SubHeader';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { fetchThemes, getThemeName, type BingoThemeConfig } from '@/features/bingo/lib/theme';
import {
  fetchFavoriteThemeIds,
  fetchThemeFavoriteCounts,
  submitThemeSuggestion,
} from '@/features/bingo/lib/theme-interactions';
import GridIcon from '@/assets/icons/ic_grid.svg';
import ListIcon from '@/assets/icons/ic_hamburger.svg';
import StarIcon from '@/assets/icons/ic_star_on.svg';
import SendIcon from '@/assets/icons/ic_send.svg';

export default function ThemeListScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const [themes, setThemes] = useState<BingoThemeConfig[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [grid, setGrid] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<'updated' | 'popular'>('updated');
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({});
  const [suggestion, setSuggestion] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([fetchThemes(true), fetchFavoriteThemeIds(), fetchThemeFavoriteCounts()])
        .then(([map, ids, counts]) => {
          if (!active) return;
          setThemes(
            Object.values(map)
              .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
              .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
          );
          setFavorites(ids);
          setFavoriteCounts(counts);
        })
        .catch(() => {
          if (active) setMessage('테마를 불러오지 못했습니다.');
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const send = async () => {
    if (!suggestion.trim() || sending) return;
    setSending(true);
    try {
      await submitThemeSuggestion(suggestion);
      setSuggestion('');
      setMessage('제안이 전송되었습니다.');
    } catch {
      setMessage('전송하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };
  const visible = (onlyFavorites ? themes.filter((t) => favorites.has(t.id)) : [...themes]).sort(
    (a, b) =>
      sort === 'popular'
        ? (favoriteCounts[b.id] ?? 0) - (favoriteCounts[a.id] ?? 0) ||
          a.sortOrder - b.sortOrder ||
          a.id.localeCompare(b.id)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() ||
          a.sortOrder - b.sortOrder ||
          a.id.localeCompare(b.id),
  );

  return (
    <View className="flex-1 bg-surface">
      <SubHeader title="테마" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View className="gap-2">
          <Text className="text-label-md text-gray-900">원하는 테마를 마음껏 제안해주세요!</Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={suggestion}
              onChangeText={setSuggestion}
              maxLength={500}
              className="flex-1"
              placeholder="원하는 테마를 적어주세요"
            />
            <Pressable
              accessibilityLabel="테마 제안 보내기"
              disabled={sending || !suggestion.trim()}
              onPress={() => void send()}
              hitSlop={8}
            >
              <SendIcon width={24} height={24} className="text-gray-900" />
            </Pressable>
          </View>
          {!!message && <Text className="text-caption-sm text-gray-600">{message}</Text>}
        </View>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-row rounded-xl bg-gray-100 p-1">
            {(['updated', 'popular'] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: sort === value }}
                onPress={() => setSort(value)}
                className={`rounded-lg px-3 py-2 ${sort === value ? 'bg-surface' : ''}`}
              >
                <Text
                  className={
                    sort === value ? 'text-label-sm text-gray-900' : 'text-label-sm text-gray-500'
                  }
                >
                  {value === 'updated' ? '업데이트순' : '인기순'}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row items-center gap-4">
            {favorites.size > 0 && (
              <Pressable
                accessibilityLabel="즐겨찾기만 보기"
                onPress={() => setOnlyFavorites((v) => !v)}
              >
                <StarIcon
                  width={24}
                  height={24}
                  className={onlyFavorites ? 'text-green-500' : 'text-gray-500'}
                />
              </Pressable>
            )}
            <Pressable accessibilityLabel="리스트 보기" onPress={() => setGrid(false)}>
              <ListIcon
                width={24}
                height={24}
                className={grid ? 'text-gray-500' : 'text-gray-900'}
              />
            </Pressable>
            <Pressable accessibilityLabel="그리드 보기" onPress={() => setGrid(true)}>
              <GridIcon
                width={24}
                height={24}
                className={grid ? 'text-gray-900' : 'text-gray-500'}
              />
            </Pressable>
          </View>
        </View>
        <View className={grid ? 'flex-row flex-wrap justify-between gap-y-4' : 'gap-2'}>
          {visible.map((theme) => (
            <Pressable
              key={theme.id}
              onPress={() =>
                router.push({ pathname: '/bingo/themes/[id]', params: { id: theme.id } })
              }
              className={
                grid ? 'w-[48%] gap-2 rounded-xl bg-gray-100 p-2' : 'rounded-xl bg-gray-100 p-4'
              }
            >
              <Text className="text-label-md text-gray-900">
                {getThemeName(theme, i18n.language)}
              </Text>
              {grid && (
                <Image
                  source={{ uri: theme.images['3x3'] }}
                  style={{ width: '100%', aspectRatio: 1080 / 1440 }}
                  contentFit="contain"
                />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
