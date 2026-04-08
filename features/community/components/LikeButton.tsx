import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import LikeOffIcon from '@/assets/icons/ic_favorite_off.svg';
import LikeOnIcon from '@/assets/icons/ic_favorite_on.svg';
import { togglePostLike, toggleCommentLike } from '@/features/community/lib/community';
import { checkAndAwardBadges } from '@/lib/badge-checker';

const SIZES = { sm: 20, md: 24 } as const;

// 파티클 설정
const PARTICLE_COLORS = ['#E02828', '#FF6B00', '#FFB800', '#FF4444', '#FF8C00'];
const PARTICLE_COUNT = 10;
const PARTICLE_SIZE = 3;

interface Particle {
  id: number;
  color: string;
  angle: number; // 방사 방향 (라디안)
}

const PARTICLES: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  angle: (i / PARTICLE_COUNT) * Math.PI * 2, // 360도 균등 분배
}));

interface LikeButtonProps {
  count: number;
  iconColor: string;
  size?: keyof typeof SIZES;
  postId?: string;
  commentId?: string;
  initialLiked?: boolean;
}

export function LikeButton({
  count,
  iconColor,
  size = 'md',
  postId,
  commentId,
  initialLiked = false,
}: LikeButtonProps) {
  const iconSize = SIZES[size];
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(count);
  const [showParticles, setShowParticles] = useState(false);
  const isProcessingRef = useRef(false);

  // 파티클별 애니메이션 값
  const particleAnims = useRef(
    PARTICLES.map(() => ({
      progress: new Animated.Value(0), // 0 → 1 (거리)
      opacity: new Animated.Value(1),
      gravity: new Animated.Value(0), // 중력 효과
    })),
  ).current;

  useEffect(() => {
    setLiked(initialLiked);
    setLikeCount(count);
  }, [initialLiked, count]);

  useEffect(() => {
    return () => {
      particleAnims.forEach(({ progress, opacity, gravity }) => {
        progress.stopAnimation();
        opacity.stopAnimation();
        gravity.stopAnimation();
      });
    };
  }, []);

  const triggerParticles = () => {
    // 초기화
    particleAnims.forEach(({ progress, opacity, gravity }) => {
      progress.setValue(0);
      opacity.setValue(1);
      gravity.setValue(0);
    });

    setShowParticles(true);

    const animations = particleAnims.map(({ progress, opacity, gravity }) =>
      Animated.parallel([
        // 방사 거리 (퍼지는 속도)
        Animated.timing(progress, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // 중력 (아래로 떨어짐)
        Animated.timing(gravity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // 페이드 아웃 (약간 딜레이 후)
        Animated.sequence([
          Animated.delay(250),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    Animated.parallel(animations).start(() => setShowParticles(false));
  };

  const handlePress = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setLiked(nextLiked);
    setLikeCount(nextCount);

    if (nextLiked) triggerParticles();

    try {
      if (postId) {
        await togglePostLike(postId, nextLiked);
        if (nextLiked) setTimeout(() => void checkAndAwardBadges('like'), 500);
      } else if (commentId) {
        await toggleCommentLike(commentId, nextLiked);
      }
    } catch {
      // 롤백
      setLiked(liked);
      setLikeCount(likeCount);
    } finally {
      isProcessingRef.current = false; // 성공/실패 모두 여기서 해제
    }
  };

  const SPREAD = 14; // 파티클 최대 퍼짐 범위
  const GRAVITY = 12; // 중력 낙하 픽셀

  return (
    <Pressable onPress={handlePress} className="flex-row items-center gap-1">
      <View style={{ width: iconSize, height: iconSize }}>
        {liked ? (
          <LikeOnIcon width={iconSize} height={iconSize} color="#E02828" />
        ) : (
          <LikeOffIcon width={iconSize} height={iconSize} color={iconColor} />
        )}

        {/* 폭죽 파티클 */}
        {showParticles &&
          PARTICLES.map((particle, i) => {
            const { progress, opacity, gravity } = particleAnims[i];

            // 방향별 x, y 이동량
            const tx = Math.cos(particle.angle) * SPREAD;
            const ty = Math.sin(particle.angle) * SPREAD;

            const translateX = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, tx],
            });

            const translateY = Animated.add(
              progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, ty],
              }),
              gravity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, GRAVITY],
              }),
            );

            const scale = progress.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 1.2, 0.6],
            });

            return (
              <Animated.View
                key={particle.id}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -PARTICLE_SIZE / 2, // iconSize/2 → -PARTICLE_SIZE/2 (아이콘 중앙)
                  left: iconSize / 2 - PARTICLE_SIZE / 2,
                  width: PARTICLE_SIZE,
                  height: PARTICLE_SIZE,
                  borderRadius: PARTICLE_SIZE / 2,
                  backgroundColor: particle.color,
                  opacity,
                  transform: [{ translateX }, { translateY }, { scale }],
                }}
              />
            );
          })}
      </View>
      <Text className="text-body-sm">{likeCount}</Text>
    </Pressable>
  );
}
