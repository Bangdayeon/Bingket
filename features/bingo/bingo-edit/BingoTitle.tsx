import { View } from 'react-native';
import { SectionLabel } from './SectionLabel';
import { TextInput } from '@/components/TextInput';
import { useEffect, useState } from 'react';
import { LIMITS } from '@/constants/limits';

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
    <View className="px-4 py-6">
      <SectionLabel label="제목" />
      <TextInput
        value={title}
        onChangeText={handleChange}
        placeholder="제목을 입력해주세요."
        maxLength={LIMITS.bingoTitle}
      />
    </View>
  );
}
