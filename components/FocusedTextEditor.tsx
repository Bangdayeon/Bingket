import { useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button';
import { Text } from './Text';

interface Props {
  visible: boolean;
  title: string;
  value: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
  maxLength: number;
  placeholder?: string;
}

export function FocusedTextEditor({
  visible,
  title,
  value,
  onChangeText,
  onClose,
  maxLength,
  placeholder,
}: Props) {
  const insets = useSafeAreaInsets();
  const input = useRef<RNTextInput>(null);
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  return (
    <Modal
      visible={visible}
      animationType="fade"
      onShow={() => input.current?.focus()}
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-surface"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          className="flex-1 px-4"
          style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-title-sm text-gray-900">{title}</Text>
            <Button label="완료" variant="ghost" size="sm" onClick={close} />
          </View>
          <RNTextInput
            ref={input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            accessibilityLabel={title}
            multiline
            maxLength={maxLength}
            textAlignVertical="top"
            className="flex-1 rounded-2xl bg-gray-200 p-3 text-body-md text-gray-900 placeholder:text-gray-500"
          />
          <Text className="mt-2 text-right text-caption-sm text-gray-500">
            {value.length}/{maxLength}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
