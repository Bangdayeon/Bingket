import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { Text } from './Text';
import Loading from './Loading';

type Variant = 'primary' | 'secondary' | 'dangerous';
type Size = 'sm' | 'md';

interface ButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  label: string;
  onClick: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-green-400',
    text: '',
  },
  secondary: {
    container: 'bg-white   border border-gray-200  ',
    text: '',
  },
  dangerous: {
    container: 'bg-red-500',
    text: 'text-white',
  },
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-10 md:h-12',
  md: 'h-14 md:h-[60px]',
};

export default function Button({
  label,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  onClick,
  ...rest
}: ButtonProps) {
  const { container, text } = variantStyles[variant];
  const isDisabled = disabled || loading;
  const heightClass = sizeStyles[size];

  const loadingColor = variant === 'secondary' ? '#6E7575' : '#48BE30';

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={`relative rounded-full items-center justify-center ${heightClass} ${container} ${
        isDisabled ? 'opacity-40' : ''
      } ${className}`}
      {...rest}
    >
      {/* 텍스트 */}
      {!loading && (
        <Text
          className={`text-label-sm md:text-label-md font-pretendard-medium ${text}`}
          style={variant === 'primary' ? { color: '#181C1C' } : undefined}
        >
          {label}
        </Text>
      )}

      {/* 로딩 (정중앙 absolute) */}
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <Loading color={loadingColor} />
        </View>
      )}
    </TouchableOpacity>
  );
}
