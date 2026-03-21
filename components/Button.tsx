import { ActivityIndicator, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'dangerous';

interface ButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  label: string;
  onClick: () => void;
  variant?: Variant;
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

export function Button({
  label,
  variant = 'primary',
  className = '',
  loading = false,
  disabled = false,
  onClick,
  ...rest
}: ButtonProps) {
  const { container, text } = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={`h-14 rounded-full items-center justify-center ${container} ${isDisabled ? 'opacity-40' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? '#181C1C' : '#ffffff'} /* gray-900 : white */
        />
      ) : (
        <Text
          className={`text-label-sm ${text}`}
          style={variant === 'primary' ? { color: '#181C1C' /* gray-900 */ } : undefined}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
