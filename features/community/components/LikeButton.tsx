import { useEffect, useRef, useState } from 'react';
import { FIXED } from '@/lib/use-colors';
import * as Sentry from '@sentry/react-native';
import { Toast } from '@/components/Toast';
import { Animated, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import LikeOffIcon from '@/assets/icons/ic_favorite_off.svg';
import LikeOnIcon from '@/assets/icons/ic_favorite_on.svg';
import { togglePostLike, toggleCommentLike } from '@/features/community/lib/community';
import { checkAndAwardBadges } from '@/lib/badge-checker';
import { useTranslation } from 'react-i18next';

const SIZES = { sm: 20, md: 24 } as const;

const PARTICLE_COLORS = FIXED.particle;
const PARTICLE_COUNT = 10;
const PARTICLE_SIZE = 3;

interface Particle {
  id: number;
  color: string;
  angle: number;
}

const PARTICLES: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
}));

interface LikeButtonProps {
  count: number;
  size?: keyof typeof SIZES;
  postId?: string;
  commentId?: string;
  initialLiked?: boolean;
}

export function LikeButton({
  count,
  size = 'md',
  postId,
  commentId,
  initialLiked = false,
}: LikeButtonProps) {
  const { t } = useTranslation();
  const iconSize = SIZES[size];
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(count);
  const [showParticles, setShowParticles] = useState(false);
  const [failed, setFailed] = useState(false);
  const isProcessingRef = useRef(false);

  const [particleAnims] = useState(() =>
    PARTICLES.map(() => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(1),
      gravity: new Animated.Value(0),
    })),
  );

  const [prevProps, setPrevProps] = useState({ initialLiked, count });
  if (prevProps.initialLiked !== initialLiked || prevProps.count !== count) {
    setPrevProps({ initialLiked, count });
    setLiked(initialLiked);
    setLikeCount(count);
  }

  useEffect(() => {
    return () => {
      particleAnims.forEach(({ progress, opacity, gravity }) => {
        progress.stopAnimation();
        opacity.stopAnimation();
        gravity.stopAnimation();
      });
    };
  }, [particleAnims]);

  const triggerParticles = () => {
    // initial
    particleAnims.forEach(({ progress, opacity, gravity }) => {
      progress.setValue(0);
      opacity.setValue(1);
      gravity.setValue(0);
    });

    setShowParticles(true);

    const animations = particleAnims.map(({ progress, opacity, gravity }) =>
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(gravity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
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
    } catch (e) {
      Sentry.captureException(e);
      setLiked(liked);
      setLikeCount(likeCount);
      setFailed(true);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const SPREAD = 14;
  const GRAVITY = 12;

  return (
    <Pressable onPress={handlePress} className="flex-row items-center gap-1">
      <View style={{ width: iconSize, height: iconSize }}>
        {liked ? (
          <LikeOnIcon width={iconSize} height={iconSize} className="text-danger" />
        ) : (
          <LikeOffIcon width={iconSize} height={iconSize} className="text-gray-700" />
        )}

        {showParticles &&
          PARTICLES.map((particle, i) => {
            const { progress, opacity, gravity } = particleAnims[i];

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
                  top: -PARTICLE_SIZE / 2,
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
      <Toast
        message={t('board.post.error.like')}
        visible={failed}
        onDismiss={() => setFailed(false)}
      />
    </Pressable>
  );
}
