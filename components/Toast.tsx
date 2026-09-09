import { Animated, Modal, Pressable } from 'react-native';
import { Text } from './Text';
import { useEffect, useRef, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

export function Toast({ message, visible, onDismiss }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateOut = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [opacity, translateY, onDismiss]);

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
  }, [visible]);

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
          <Animated.View
            style={{
              backgroundColor: '#4C5252' /* gray-700 */,
              borderRadius: 9999,
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
          >
            <Text className="text-body-sm text-white">{message}</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
