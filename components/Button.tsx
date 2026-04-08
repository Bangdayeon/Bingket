import { ActivityIndicator, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Text } from './Text';

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
    container: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
    text: '',
  },
  dangerous: {
    container: 'bg-red-500',
    text: 'text-white',
  },
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-10', // 약 40px
  md: 'h-14', // 약 56px
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

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={`rounded-full items-center justify-center ${heightClass} ${container} ${
        isDisabled ? 'opacity-40' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#181C1C' : '#ffffff'} />
      ) : (
        <Text
          className={`text-label-sm ${text}`}
          style={variant === 'primary' ? { color: '#181C1C' } : undefined}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
