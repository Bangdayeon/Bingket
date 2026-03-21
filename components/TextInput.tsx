import { TextInput as RNTextInput, TextInputProps, View, useColorScheme } from 'react-native';

type Variant = 'default' | 'community';

interface Props extends TextInputProps {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-100 dark:bg-gray-800',
  community: 'bg-sky-100 dark:bg-sky-900',
};

export function TextInput({ variant = 'default', className = '', ...rest }: Props) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View className={`rounded-full h-9 px-4 justify-center ${variantStyles[variant]} ${className}`}>
      <RNTextInput
        placeholderTextColor="#929898"
        className="text-body-sm"
        style={{ color: isDark ? '#F6F7F7' : '#181C1C' /* gray-100 : gray-900 */ }}
        {...rest}
      />
    </View>
  );
}
