import { Modal as RNModal, Pressable, View } from 'react-native';
import { Text } from './Text';
import Button from './Button';
import { ReactNode } from 'react';

type ModalVariant = 'default' | 'warning' | 'error' | 'success' | 'single';

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

export function Modal({
  visible,
  title,
  body,
  variant = 'default',
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  onDismiss,
}: ModalProps) {
  const getConfirmVariant = () => {
    if (variant === 'warning' || variant === 'error') return 'dangerous';
    return 'primary';
  };

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
        <Pressable className="w-full bg-white dark:bg-gray-900 rounded-[24px] px-6 pt-6 pb-5">
          {/* Title */}
          <Text className="text-title-sm mb-3">{title}</Text>

          {/* Body */}
          {body && (
            <View className="mb-6">
              {typeof body === 'string' ? (
                <Text className="text-body-md text-gray-600 dark:text-gray-300">{body}</Text>
              ) : (
                body
              )}
            </View>
          )}

          {/* Buttons */}
          {variant === 'single' || variant === 'success' || variant === 'error' ? (
            <Button label={confirmLabel} variant={getConfirmVariant()} onClick={onConfirm} />
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
                variant={getConfirmVariant()}
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
