import { TextInput as RNTextInput, TextInputProps, View, useColorScheme } from 'react-native';

type Variant = 'default' | 'community';

interface Props extends TextInputProps {
  variant?: Variant;
  maxHeight?: number;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-100 dark:bg-gray-800',
  community: 'bg-sky-100 dark:bg-sky-900',
};

export function TextInput({
  variant = 'default',
  maxHeight,
  className = '',
  style,
  ...rest
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const hasMaxHeight = maxHeight !== undefined;
  return (
    <View
      className={`rounded-2xl px-4 ${hasMaxHeight ? 'justify-start py-2' : 'justify-center h-9'} ${variantStyles[variant]} ${className}`}
      style={hasMaxHeight ? { maxHeight } : undefined}
    >
      <RNTextInput
        placeholderTextColor="#929898" /* gray-500 */
        className="text-body-sm"
        style={[{ color: isDark ? '#F6F7F7' : '#181C1C' /* gray-100 : gray-900 */ }, style]}
        multiline={hasMaxHeight || rest.multiline}
        scrollEnabled={hasMaxHeight}
        {...rest}
      />
    </View>
  );
}
