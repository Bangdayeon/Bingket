import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useResponsive } from '@/lib/use-responsive';
import { BingoThumbnail } from './BingoThumbnail';
import type { FeedItem } from '@/features/profile/lib/profile';

const H_PADDING = 20;
const GAP = 12;
const COLUMNS = 2;

const VISIBILITY_LABEL: Record<string, string> = {
  private: '나만 보기',
  friends: '친구 공개',
  public: '전체 공개',
};

interface Props {
  items: FeedItem[];
  /** 본인 피드면 공개범위 배지를 함께 노출한다 */
  isMe: boolean;
  onItemPress: (item: FeedItem) => void;
  emptyText?: string;
}

export function FeedGrid({ items, isMe, onItemPress, emptyText = '아직 빙고가 없어요.' }: Props) {
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
    <View
      style={{
        paddingHorizontal: H_PADDING,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
      }}
    >
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => onItemPress(item)} style={{ width: itemWidth }}>
          <BingoThumbnail
            width={itemWidth}
            grid={item.grid}
            theme={item.theme}
            title={item.title}
            cells={item.cells}
          />

          <View className="flex-row items-center gap-1.5 mt-2 mb-1">
            <View
              className={`px-2 py-0.5 rounded-full ${
                item.status === 'done' ? 'bg-green-400' : 'bg-gray-200'
              }`}
            >
              <Text className="text-caption-sm" style={{ color: '#181C1C' /* gray-900 */ }}>
                {item.status === 'done' ? '완료' : '진행 중'}
              </Text>
            </View>

            {isMe && item.visibility && (
              <Text className="text-caption-sm text-gray-500" numberOfLines={1}>
                {VISIBILITY_LABEL[item.visibility]}
              </Text>
            )}
          </View>

          <Text className="text-caption-md text-gray-700" numberOfLines={1}>
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
