import { FlatList, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useResponsive } from '@/lib/use-responsive';
import { BingoThumbnail } from './BingoThumbnail';
import type { FeedItem } from '@/features/profile/lib/profile';

const H_PADDING = 16;
// 시안: 390 화면에서 172px 두 칸이 나오는 간격
const GAP = 14;
const COLUMNS = 2;

interface Props {
  items: FeedItem[];
  /** 팀에 속한 빙고판 id. 해당 항목에 '함께' 배지를 붙인다 */
  teamBoardIds?: Set<string>;
  onItemPress: (item: FeedItem) => void;
  emptyText?: string;
}

export function FeedGrid({
  items,
  teamBoardIds,
  onItemPress,
  emptyText = '아직 빙고가 없어요.',
}: Props) {
  const { contentWidth } = useResponsive();
  const itemWidth = (contentWidth - H_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  if (items.length === 0) {
    return (
      <View className="py-20 items-center">
        <Text className="text-body-md text-gray-400">{emptyText}</Text>
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
                {item.status === 'done' ? '완료' : '진행 중'}
              </Text>
            </View>

            {teamBoardIds?.has(item.id) && (
              <View className="px-2 py-0.5 rounded-full bg-green-50">
                <Text className="text-caption-sm text-green-800">함께</Text>
              </View>
            )}

            <Text className="flex-1 text-body-sm text-gray-700" numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}
