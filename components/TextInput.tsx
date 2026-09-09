import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

type Variant = 'default' | 'community';

interface Props extends TextInputProps {
  variant?: Variant;
  maxHeight?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rounded?: number;
}

// 시안 Input: 높이 48, radius 12, gray-200 배경, 좌우 여백 16, body-md / gray-800.
const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-200',
  community: 'bg-green-50',
};

export const TextInput = forwardRef<RNTextInput, Props>(function TextInput(
  { variant = 'default', maxHeight, leftIcon, rightIcon, rounded, className = '', style, ...rest },
  ref,
) {
  const isMultiline = rest.multiline || maxHeight !== undefined;

  return (
    <View
      className={`
        ${rounded === undefined ? 'rounded-xl' : ''} px-4
        flex-row
        ${isMultiline ? 'py-3 items-start' : 'h-12 items-center'}
        ${variantStyles[variant]}
        ${className}
      `}
      style={[
        rounded !== undefined ? { borderRadius: rounded } : null,
        maxHeight !== undefined ? { maxHeight } : null,
      ]}
    >
      {leftIcon && <View className="mr-2">{leftIcon}</View>}
      <RNTextInput
        ref={ref}
        placeholderTextColor="#929898" /* gray-500 */
        className="flex-1 text-body-md text-gray-800"
        style={style}
        multiline={isMultiline}
        scrollEnabled={maxHeight !== undefined}
        {...rest}
      />
      {rightIcon && <View className="ml-2">{rightIcon}</View>}
    </View>
  );
});
