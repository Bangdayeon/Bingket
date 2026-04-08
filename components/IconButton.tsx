import { useEffect } from 'react';
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Variant = 'primary' | 'secondary' | 'ghost';

interface IconButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  icon: React.ReactNode;
  onClick: () => void;
  variant?: Variant;
  active?: boolean;
  className?: string;
  disabled?: boolean;
  size?: number;
}

const variantStyles: Record<Variant, { default: string; active: string }> = {
  primary: {
    default: 'bg-green-400',
    active: 'bg-green-500',
  },
  secondary: {
    default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
    active: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  },
  ghost: {
    default: 'bg-transparent',
    active: 'bg-transparent',
  },
};

export default function IconButton({
  icon,
  onClick,
  variant = 'primary',
  active = false,
  className = '',
  disabled = false,
  size = 48,
  ...rest
}: IconButtonProps) {
  const { default: defaultStyle, active: activeStyle } = variantStyles[variant];
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#F6F7F7' : '#181C1C'; /* gray-100 : gray-900 */
  const coloredIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
        color: (icon.props as { color?: string }).color ?? iconColor,
      })
    : icon;

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(active ? 1 : 0, {
      damping: 5,
      stiffness: 180,
      mass: 0.4,
    });
  }, [active]);

  const animatedBgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={disabled}
      activeOpacity={0.7}
      className={`rounded-full items-center justify-center ${active ? activeStyle : defaultStyle} ${disabled ? 'opacity-40' : ''} ${className}`}
      style={{ width: size, height: size, overflow: 'hidden' }}
      {...rest}
    >
      {variant === 'ghost' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: '#F2FDE8' /* green-100 */,
            },
            animatedBgStyle,
          ]}
        />
      )}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{coloredIcon}</View>
    </TouchableOpacity>
  );
}
