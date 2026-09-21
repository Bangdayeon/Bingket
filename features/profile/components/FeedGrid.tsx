import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { CompletedBingoMenu } from './CompletedBingoMenu';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useResponsive } from '@/lib/use-responsive';
import { BingoThumbnail } from './BingoThumbnail';
import type { FeedItem } from '@/features/profile/lib/profile';
import { useTranslation } from 'react-i18next';

const H_PADDING = 16;
const GAP = 14;
const COLUMNS = 2;

interface Props {
  items: FeedItem[];
  onItemPress: (item: FeedItem) => void;
  emptyText?: string;
  onChanged?: () => void;
}

export function FeedGrid({ items, onChanged, onItemPress, emptyText }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { contentWidth } = useResponsive();
  const itemWidth = (contentWidth - H_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const defaultEmptyText = t('home.boardNotCreated');

  if (items.length === 0) {
    return (
      <View className="py-20 items-center gap-6">
        <Text className="text-body-md text-gray-400 text-center">
          {emptyText ?? defaultEmptyText}
        </Text>
        <Button label={t('home.addBingo.default')} onClick={() => router.push('/bingo/add')} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      numColumns={COLUMNS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: H_PADDING,
        paddingTop: 16,
      }}
      columnWrapperStyle={{
        gap: GAP,
      }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onItemPress(item)}
          style={{
            width: itemWidth,
            marginBottom: GAP,
          }}
        >
          <BingoThumbnail
            width={itemWidth}
            grid={item.grid}
            theme={item.theme}
            title={item.title}
            cells={item.cells}
          />

          <View className="mt-2 flex-row items-center gap-1.5">
            <View
              className={`px-2 py-0.5 rounded-full ${
                item.status === 'done' ? 'bg-green-400' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-caption-sm ${
                  item.status === 'done' ? 'text-on-brand-dark' : 'text-gray-800'
                }`}
              >
                {item.status === 'done' ? t('common.stateDone') : t('common.stateProgress')}
              </Text>
            </View>

            <Text className="flex-1 text-body-sm text-gray-700" numberOfLines={1}>
              {item.title}
            </Text>
            {item.status === 'done' && item.visibility !== null && onChanged && (
              <CompletedBingoMenu item={item} onChanged={onChanged} />
            )}
          </View>
        </Pressable>
      )}
    />
  );
}
