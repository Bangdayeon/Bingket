import { View, Text } from 'react-native';
import TextInput from '@/components/common/TextInput';
import { useState } from 'react';

export default function BingoTitle() {
  const [title, setTitle] = useState('');
  return (
    <View className="px-5 pt-5 pb-8">
      <Text className="text-title-md text-gray-900 mb-2">제목</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="제목을 입력해주세요." />
    </View>
  );
}
