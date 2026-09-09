import { useEffect } from 'react';
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Loading from './Loading';

type Variant = 'primary' | 'secondary' | 'ghost';

interface IconButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  icon: React.ReactNode;
  onClick: () => void;
  variant?: Variant;
  active?: boolean;
  className?: string;
  disabled?: boolean;
  size?: number;
  loading?: boolean;
}

const variantStyles: Record<Variant, { default: string; active: string }> = {
  primary: {
    default: 'bg-green-400',
    active: 'bg-green-500',
  },
  secondary: {
    default: 'bg-white   border border-gray-200  ',
    active: 'bg-gray-100   border border-gray-200  ',
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
  loading = false, // ✅
  ...rest
}: IconButtonProps) {
  const { default: defaultStyle, active: activeStyle } = variantStyles[variant];

  const iconColor = '#181C1C'; /* gray-900 */

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

  const isDisabled = disabled || loading;

  const loadingColor =
    variant === 'secondary' || variant === 'ghost'
      ? '#2E3333' /* gray-800 */
      : '#F6F7F7'; /* gray-100 */

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={isDisabled}
      activeOpacity={0.7}
      className={`relative rounded-full items-center justify-center ${
        active ? activeStyle : defaultStyle
      } ${isDisabled ? 'opacity-40' : ''} ${className}`}
      style={{ width: size, height: size, overflow: 'hidden' }}
      {...rest}
    >
      {/* ghost ripple */}
      {variant === 'ghost' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: '#ECF1D5' /* green-100 */,
            },
            animatedBgStyle,
          ]}
        />
      )}

      {/* 아이콘 */}
      {!loading && (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>{coloredIcon}</View>
      )}

      {/* 로딩 (정중앙 overlay) */}
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <Loading color={loadingColor} />
        </View>
      )}
    </TouchableOpacity>
  );
}
