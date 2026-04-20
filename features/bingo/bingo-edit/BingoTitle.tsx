import { View } from 'react-native';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { useEffect, useState } from 'react';

interface BingoTitleProps {
  value?: string;
  onChange?: (text: string) => void;
}

export function BingoTitle({ value = '', onChange }: BingoTitleProps) {
  const [title, setTitle] = useState(value);

  useEffect(() => {
    setTitle(value);
  }, [value]);

  const handleChange = (text: string) => {
    setTitle(text);
    onChange?.(text);
  };

  return (
    <View className="px-5 py-6">
      <Text className="text-title-md font-pretendard-medium mb-3">제목</Text>
      <TextInput value={title} onChangeText={handleChange} placeholder="제목을 입력해주세요." />
    </View>
  );
}
