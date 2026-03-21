import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, useColorScheme } from 'react-native';
import { Text } from '@/components/Text';
import LikeOffIcon from '@/assets/icons/ic_favorite_off.svg';
import LikeOnIcon from '@/assets/icons/ic_favorite_on.svg';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import { CommunityPost } from '@/types/community';

const ICON_SIZE = 20;

interface PostCardProps {
  post: CommunityPost;
}

function Avatar() {
  return <View className="w-[30px] h-[30px] rounded-full bg-gray-300 border border-gray-300" />;
}

function BingoGridPreview({ items }: { items: string[][] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
      {items.flat().map((text, i) => (
        <View
          key={i}
          style={{
            width: '31.3%',
            height: 72,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#D2D6D6', // gray-300
            backgroundColor: '#FDFDFD', // white
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          <Text className="text-body-sm text-center" numberOfLines={2}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PostCard({ post }: PostCardProps) {
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showFloat, setShowFloat] = useState(false);

  const floatY = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      floatY.stopAnimation();
      floatOpacity.stopAnimation();
    };
  }, []);

  const handleLikePress = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setShowFloat(true);
      floatY.setValue(0);
      floatOpacity.setValue(1);

      Animated.parallel([
        Animated.timing(floatY, {
          toValue: -40,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(floatOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => setShowFloat(false));
    } else {
      setLiked(false);
      setLikeCount((c) => c - 1);
    }
  };

  return (
    <View className="px-5 pt-4 pb-4">
      <View className="flex-row items-center gap-2">
        <Avatar />
        <Text className="text-label-sm">{post.author}</Text>
        <Text className="text-caption-sm" style={{ color: '#181C1C' }}>
          •
        </Text>
        <Text className="text-caption-sm" style={{ color: '#929898' /* gray-500 */ }}>
          {post.timeAgo}
        </Text>
      </View>

      {post.bingoItems && <BingoGridPreview items={post.bingoItems} />}

      <Text className="text-body-sm mt-3">{post.body}</Text>

      <View className="flex-row items-center gap-4 mt-3">
        <Pressable onPress={handleLikePress} className="flex-row items-center gap-1">
          <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>
            {liked ? (
              <LikeOnIcon width={ICON_SIZE} height={ICON_SIZE} color="#E02828" /* red-500 */ />
            ) : (
              <LikeOffIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />
            )}
            {showFloat && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  transform: [{ translateY: floatY }],
                  opacity: floatOpacity,
                }}
              >
                <LikeOnIcon width={ICON_SIZE} height={ICON_SIZE} color="#E02828" /* red-500 */ />
              </Animated.View>
            )}
          </View>
          <Text className="text-body-sm">{likeCount}</Text>
        </Pressable>

        <View className="flex-row items-center gap-1">
          <SMSIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />
          <Text className="text-body-sm">{post.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}
