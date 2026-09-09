import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  maxHeight?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = forwardRef<RNTextInput, Props>(function TextInput(
  { maxHeight, leftIcon, rightIcon, className = '', style, ...rest },
  ref,
) {
  const isMultiline = rest.multiline || maxHeight !== undefined;

  // 시안 Input: 높이 48, radius 12(rounded-xl), gray-200 배경, 좌우 여백 16, body-md / gray-800.
  return (
    <View
      className={`
        flex-row rounded-xl bg-gray-200 px-4
        ${isMultiline ? 'py-3 items-start' : 'h-12 items-center'}
        ${className}
      `}
      style={maxHeight !== undefined ? { maxHeight } : undefined}
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
