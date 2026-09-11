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
        className="flex-1 text-body-md text-gray-800 placeholder:text-gray-500"
        style={style}
        multiline={isMultiline}
        scrollEnabled={maxHeight !== undefined}
        {...rest}
      />
      {rightIcon && <View className="ml-2">{rightIcon}</View>}
    </View>
  );
});
