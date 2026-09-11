import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { Text } from './Text';
import Loading from './Loading';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  label: string;
  onClick: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
}

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'h-9 px-[14px] rounded-[10px]', text: 'text-label-sm' },
  md: { container: 'h-12 px-6 rounded-2xl', text: 'text-label-md' },
  lg: { container: 'h-14 px-6 rounded-2xl', text: 'text-label-md' },
};

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-green-500', text: 'text-on-brand' },
  secondary: { container: 'border border-gray-300', text: 'text-gray-800' },
  danger: { container: 'bg-danger', text: 'text-on-danger' },
  ghost: { container: '', text: 'text-gray-800' },
};

const DISABLED_FILLED = { container: 'bg-gray-400', text: 'text-gray-700' };

const BUTTON_FONT = 'font-pretendard-medium';

const LOADING_CLASS: Record<Variant, string> = {
  primary: 'text-on-brand',
  secondary: 'text-gray-800',
  danger: 'text-on-danger',
  ghost: 'text-gray-800',
};

export default function Button({
  label,
  variant = 'primary',
  size = 'lg',
  className = '',
  loading = false,
  disabled = false,
  onClick,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isFilled = variant === 'primary' || variant === 'danger';

  const { container: sizeContainer, text: sizeText } = sizeStyles[size];
  const { container, text } = variantStyles[variant];

  const disabledContainer = isFilled ? DISABLED_FILLED.container : container;
  const disabledText = isFilled ? DISABLED_FILLED.text : 'text-gray-400';

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={`relative flex-row items-center justify-center ${sizeContainer} ${
        isDisabled ? disabledContainer : container
      } ${className}`}
      {...rest}
    >
      {!loading && (
        <Text
          className={`text-center ${sizeText} ${BUTTON_FONT} ${isDisabled ? disabledText : text}`}
        >
          {label}
        </Text>
      )}

      {/* 로딩 (정중앙 absolute) */}
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <Loading className={LOADING_CLASS[variant]} />
        </View>
      )}
    </TouchableOpacity>
  );
}
