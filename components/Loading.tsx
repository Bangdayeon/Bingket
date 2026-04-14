import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

type Variant = 'default' | 'iconloading';

interface LoadingProps {
  variant?: Variant;
  size?: number;
  color?: string;
  spacing?: number;
}

export default function Loading({
  variant = 'default',
  size = 7,
  color = '#48BE30',
  spacing = 6,
}: LoadingProps) {
  // default (기존)
  const animations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // iconloading (회전)
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === 'default') {
      const createAnimation = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: -8,
              duration: 250,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 250,
              easing: Easing.bounce, // 👉 쫀득 느낌
              useNativeDriver: true,
            }),
          ]),
        );

      const loops = animations.map((anim, i) => createAnimation(anim, i * 150));

      loops.forEach((loop) => loop.start());

      return () => loops.forEach((loop) => loop.stop());
    }

    if (variant === 'iconloading') {
      const loop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // 👉 살짝 쫀득한 커브
          useNativeDriver: true,
        }),
      );

      loop.start();
      return () => loop.stop();
    }
  }, [variant]);

  // ---------------- default ----------------
  if (variant === 'default') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {animations.map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              marginHorizontal: spacing / 2,
              transform: [{ translateY: anim }],
            }}
          />
        ))}
      </View>
    );
  }

  // ---------------- iconloading ----------------
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const radius = size * 1.6;
  const DOT_COUNT = 5;

  return (
    <Animated.View
      style={{
        width: radius * 2,
        height: radius * 2,
        transform: [{ rotate }],
      }}
    >
      {[...Array(DOT_COUNT)].map((_, i) => {
        const angle = (i / DOT_COUNT) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: radius + x - size / 2,
              top: radius + y - size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              opacity: 0.3 + i / 7, // 👉 약간의 깊이감
            }}
          />
        );
      })}
    </Animated.View>
  );
}
