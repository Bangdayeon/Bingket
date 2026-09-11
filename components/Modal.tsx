import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { Text } from './Text';
import Button from './Button';
import { Portal } from './Portal';
import { ReactNode, useEffect, useRef, useState } from 'react';

type ModalVariant = 'default' | 'warning' | 'error' | 'success' | 'single';

interface ModalProps {
  visible: boolean;
  title: string;
  body?: ReactNode;
  variant?: ModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
}

const FADE_IN_MS = 180;
const FADE_OUT_MS = 140;

/* PAST PROBLEM
 * default RN Modal block first fast touch by dismiss animation and native work
 * so use Portal Overlay and use pointerEvents: when start to modal closing, set pointerEvents="none"
 */
export function Modal({
  visible,
  title,
  body,
  variant = 'default',
  confirmLabel = '확인',
  cancelLabel = '취소',
  confirmDisabled = false,
  confirmLoading = false,
  onConfirm,
  onCancel,
  onDismiss,
}: ModalProps) {
  const confirmVariant = variant === 'warning' || variant === 'error' ? 'danger' : 'primary';
  const isSingleButton = variant === 'single' || variant === 'success' || variant === 'error';

  const [opacity] = useState(() => new Animated.Value(visible ? 1 : 0));
  // take down from tree when animation end
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  // closing, send touch to below
  const [interactive, setInteractive] = useState(visible);

  useEffect(() => {
    if (visible) {
      mountedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      setInteractive(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!mountedRef.current) return;

    setInteractive(false);
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      mountedRef.current = false;
      setMounted(false);
    });
  }, [visible, opacity]);

  // instead of Native Modal's onRequestClose
  useEffect(() => {
    if (!visible) return;
    const close = onDismiss ?? onCancel;
    if (!close) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onDismiss, onCancel]);

  if (!mounted) return null;

  return (
    <Portal>
      <Animated.View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }}
        pointerEvents={interactive ? 'auto' : 'none'}
      >
        {/* Native Modal's keyboard miss */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
        >
          <Pressable
            className="flex-1 items-center justify-center bg-scrim/70 px-5"
            onPress={onDismiss}
          >
            <Pressable className="w-full rounded-3xl bg-white p-6 md:max-w-[480px]">
              <Text className="text-title-md font-pretendard-semibold text-gray-900">{title}</Text>

              {body && (
                <View className="mt-4">
                  {typeof body === 'string' ? (
                    <Text className="text-body-md text-gray-900">{body}</Text>
                  ) : (
                    body
                  )}
                </View>
              )}

              <View className="mt-[22px] flex-row items-center justify-end gap-2">
                {!isSingleButton && (
                  <Button
                    label={cancelLabel}
                    variant="secondary"
                    size="md"
                    onClick={onCancel ?? (() => {})}
                    className="border-surface bg-surface"
                  />
                )}
                <Button
                  label={confirmLabel}
                  variant={confirmVariant}
                  size="md"
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  loading={confirmLoading}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Animated.View>
    </Portal>
  );
}
