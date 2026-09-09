import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useResponsive } from '@/lib/use-responsive';
import { BingoThumbnail } from './BingoThumbnail';
import type { FeedItem } from '@/features/profile/lib/profile';

const H_PADDING = 16;
// 시안: 390 화면에서 172px 두 칸이 나오는 간격
const GAP = 14;
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
  /** 팀에 속한 빙고판 id. 해당 항목에 '함께' 배지를 붙인다 */
  teamBoardIds?: Set<string>;
  onItemPress: (item: FeedItem) => void;
  emptyText?: string;
}

export function FeedGrid({
  items,
  isMe,
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

            {teamBoardIds?.has(item.id) && (
              <View className="px-2 py-0.5 rounded-full bg-green-50">
                <Text className="text-caption-sm" style={{ color: '#3F5C1D' /* green-800 */ }}>
                  함께
                </Text>
              </View>
            )}

            {isMe && item.visibility && (
              <Text className="text-caption-sm text-gray-500" numberOfLines={1}>
                {VISIBILITY_LABEL[item.visibility]}
              </Text>
            )}
          </View>

          <Text className="text-center text-body-sm text-gray-700" numberOfLines={1}>
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
