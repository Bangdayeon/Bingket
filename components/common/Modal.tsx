import { Modal as RNModal, Pressable, Text, View } from 'react-native';
import Button from './Button';
import { ReactNode } from 'react';

type ModalVariant = 'default' | 'warning' | 'single';

interface ModalProps {
  visible: boolean;
  title: string;
  body?: ReactNode;
  variant?: ModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
}

export default function Modal({
  visible,
  title,
  body,
  variant = 'default',
  confirmLabel = '확인',
  cancelLabel = '취소하기',
  onConfirm,
  onCancel,
  onDismiss,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss ?? onCancel}
    >
      <Pressable
        className="flex-1 bg-black/40 items-center justify-center px-5"
        onPress={onDismiss}
      >
        <Pressable className="w-full bg-white rounded-[30px] px-5 pt-6 pb-5">
          <Text className="text-title-md text-gray-900 mb-2">{title}</Text>
          {body ? (
            <View className="mb-6">
              {typeof body === 'string' ? (
                <Text className="text-body-lg text-gray-900">{body}</Text>
              ) : (
                body
              )}
            </View>
          ) : (
            <View className="mb-6" />
          )}

          {variant === 'single' ? (
            <Button label={confirmLabel} variant="primary" onClick={onConfirm} />
          ) : (
            <View className="flex-row gap-3">
              <Button
                label={cancelLabel}
                variant="secondary"
                onClick={onCancel ?? (() => {})}
                className="flex-1"
              />
              <Button
                label={confirmLabel}
                variant={variant === 'warning' ? 'dangerous' : 'primary'}
                onClick={onConfirm}
                className="flex-1"
              />
            </View>
          )}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
