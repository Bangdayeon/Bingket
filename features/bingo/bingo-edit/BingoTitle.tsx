import { View } from 'react-native';
import { SectionLabel } from './SectionLabel';
import { TextInput } from '@/components/TextInput';
import { useState } from 'react';
import { LIMITS } from '@/constants/limits';
import { useTranslation } from 'react-i18next';

interface BingoTitleProps {
  value?: string;
  onChange?: (text: string) => void;
}

export function BingoTitle({ value = '', onChange }: BingoTitleProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

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
      <SectionLabel label={t('home.field.title.label')} />
      <TextInput
        value={title}
        onChangeText={handleChange}
        placeholder={t('common.limitPlaceholder', { count: LIMITS.bingoTitle })}
        maxLength={LIMITS.bingoTitle}
      />
    </View>
  );
}
