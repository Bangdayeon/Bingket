import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

type Variant = 'default' | 'community';

interface Props extends TextInputProps {
  variant?: Variant;
  maxHeight?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-100  ',
  community: 'bg-sky-100  ',
};

export const TextInput = forwardRef<RNTextInput, Props>(function TextInput(
  { variant = 'default', maxHeight, leftIcon, rightIcon, className = '', style, ...rest },
  ref,
) {
  const isMultiline = rest.multiline || maxHeight !== undefined;
  const borderRadiusClass = isMultiline ? 'rounded-2xl' : 'rounded-full';

  return (
    <View
      className={`
        ${borderRadiusClass} px-4
        flex-row
        ${isMultiline ? 'py-3 items-start' : 'h-11 items-center'}
        ${variantStyles[variant]}
        ${className}
      `}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {leftIcon && <View className="mr-2">{leftIcon}</View>}
      <RNTextInput
        ref={ref}
        placeholderTextColor="#929898"
        className="flex-1 text-body-sm text-gray-900  "
        style={style}
        multiline={isMultiline}
        scrollEnabled={maxHeight !== undefined}
        {...rest}
      />
      {rightIcon && <View className="ml-2">{rightIcon}</View>}
    </View>
  );
});
