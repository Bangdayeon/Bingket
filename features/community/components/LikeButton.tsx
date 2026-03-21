import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import LikeOffIcon from '@/assets/icons/ic_favorite_off.svg';
import LikeOnIcon from '@/assets/icons/ic_favorite_on.svg';

const ICON_SIZE = 20;

interface LikeButtonProps {
  count: number;
  iconColor: string;
}

export function LikeButton({ count, iconColor }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(count);
  const [showFloat, setShowFloat] = useState(false);

  const floatY = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      floatY.stopAnimation();
      floatOpacity.stopAnimation();
    };
  }, []);

  const handlePress = () => {
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
    <Pressable onPress={handlePress} className="flex-row items-center gap-1">
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
  );
}
