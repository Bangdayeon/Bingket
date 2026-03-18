import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

type Variant = 'default' | 'community';

interface Props extends TextInputProps {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-100',
  community: 'bg-sky-100',
};

export default function TextInput({ variant = 'default', className = '', ...rest }: Props) {
  return (
    <View className={`rounded-full h-9 px-4 justify-center ${variantStyles[variant]} ${className}`}>
      <RNTextInput placeholderTextColor="#929898" className="text-body-sm" {...rest} />
    </View>
  );
}
