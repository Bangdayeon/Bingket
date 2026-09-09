import { View } from 'react-native';
import { SectionLabel } from './SectionLabel';
import { TextInput } from '@/components/TextInput';
import { useState } from 'react';
import { LIMITS } from '@/constants/limits';

interface BingoTitleProps {
  value?: string;
  onChange?: (text: string) => void;
}

export function BingoTitle({ value = '', onChange }: BingoTitleProps) {
  const [title, setTitle] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  // prop이 바뀌면 렌더 중에 맞춘다. 효과로 하면 낡은 값으로 한 번 그린 뒤
  // 다시 렌더돼서 입력창이 깜빡인다.
  if (value !== prevValue) {
    setPrevValue(value);
    setTitle(value);
  }

  const handleChange = (text: string) => {
    setTitle(text);
    onChange?.(text);
  };

  return (
    <View className="px-4">
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
