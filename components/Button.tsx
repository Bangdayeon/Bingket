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

/**
 * 시안의 Button 컴포넌트 세트를 그대로 옮긴 것.
 * - 크기는 sm(36) / md(48) / lg(56) 세 가지. 시안의 `Default` 변형이 lg에 해당한다.
 * - 시안은 disabled를 별도 변형으로 그려 뒀다. 채워진 변형(primary·danger)은
 *   gray-400 배경 + gray-700 글자로 바뀌고, 선/글자만 있는 변형(secondary·ghost)은
 *   모양을 유지한 채 글자만 흐려진다.
 */
const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'h-9 px-[14px] rounded-[10px]', text: 'text-label-sm' },
  md: { container: 'h-12 px-6 rounded-2xl', text: 'text-label-md' },
  lg: { container: 'h-14 px-6 rounded-2xl', text: 'text-label-md' },
};

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-green-500', text: 'text-gray-100' },
  secondary: { container: 'border border-gray-300', text: 'text-gray-800' },
  danger: { container: 'bg-danger', text: 'text-white' },
  ghost: { container: '', text: 'text-gray-800' },
};

const DISABLED_FILLED = { container: 'bg-gray-400', text: 'text-gray-700' };

// sm은 항상 SemiBold, lg는 항상 Bold, md는 채움 여부에 따라 갈린다.
const fontFor = (size: Size, variant: Variant) => {
  if (size === 'sm') return 'font-pretendard-semibold';
  if (size === 'lg') return 'font-pretendard-bold';
  return variant === 'ghost' || variant === 'secondary'
    ? 'font-pretendard-bold'
    : 'font-pretendard-medium';
};

const LOADING_COLOR: Record<Variant, string> = {
  primary: '#F6F7F7', // gray-100
  secondary: '#2E3333', // gray-800
  danger: '#FDFDFD', // white
  ghost: '#2E3333', // gray-800
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
          className={`text-center ${sizeText} ${fontFor(size, variant)} ${
            isDisabled ? disabledText : text
          }`}
        >
          {label}
        </Text>
      )}

      {/* 로딩 (정중앙 absolute) */}
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <Loading color={LOADING_COLOR[variant]} />
        </View>
      )}
    </TouchableOpacity>
  );
}
