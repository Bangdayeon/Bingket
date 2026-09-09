import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

// 시안: 트랙 59×30, 손잡이 24, 좌우 여백 4.
const TRACK_WIDTH = 59;
const TRACK_HEIGHT = 30;
const KNOB_SIZE = 24;
const KNOB_MARGIN = 4;

export function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [KNOB_MARGIN, TRACK_WIDTH - KNOB_SIZE - KNOB_MARGIN],
  });
  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D2D6D6', '#94BD52'],
  }); /* gray-300 : green-400 */

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      className={disabled ? 'opacity-40' : ''}
    >
      <Animated.View
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: 9999,
          backgroundColor,
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: 9999,
            backgroundColor: '#FDFDFD' /* white */,
            transform: [{ translateX }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
