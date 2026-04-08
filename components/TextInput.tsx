import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

type Variant = 'default' | 'community';

interface Props extends TextInputProps {
  variant?: Variant;
  maxHeight?: number;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-100 dark:bg-gray-800',
  community: 'bg-sky-100 dark:bg-sky-900',
};

export const TextInput = forwardRef<RNTextInput, Props>(function TextInput(
  { variant = 'default', maxHeight, className = '', style, ...rest },
  ref,
) {
  const isMultiline = rest.multiline || maxHeight !== undefined;
  const borderRadiusClass = isMultiline ? 'rounded-2xl' : 'rounded-full';

  return (
    <View
      className={`
        ${borderRadiusClass} px-4
        ${isMultiline ? 'py-3 justify-start' : 'h-11 justify-center'} 
        ${variantStyles[variant]} 
        ${className}
      `}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <RNTextInput
        ref={ref}
        placeholderTextColor="#929898"
        className="text-body-sm text-gray-900 dark:text-gray-100"
        style={style}
        multiline={isMultiline}
        scrollEnabled={maxHeight !== undefined}
        {...rest}
      />
    </View>
  );
});
