import { Animated, Modal, Pressable } from 'react-native';
import { Text } from './Text';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

export function Toast({ message, visible, onDismiss }: ToastProps) {
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-12));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // onDismiss가 매 렌더 새 함수로 와도 animateOut의 참조는 그대로여야 한다.
  // animateOut이 바뀌면 아래 효과가 다시 돌면서 등장 애니메이션과 3초 타이머가 리셋된다.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const animateOut = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver: true }),
    ]).start(() => onDismissRef.current());
  }, [opacity, translateY]);

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(-12);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(animateOut, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, opacity, translateY, animateOut]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={animateOut}>
      <Pressable style={{ flex: 1 }} onPress={animateOut}>
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top + 16,
            left: 20,
            right: 20,
            alignItems: 'center',
            opacity,
            transform: [{ translateY }],
          }}
          pointerEvents="none"
        >
          <Animated.View className="rounded-full bg-gray-700 px-5 py-2.5">
            <Text className="text-body-sm text-white">{message}</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
