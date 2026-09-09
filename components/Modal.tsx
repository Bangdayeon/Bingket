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

/**
 * 시안 ConfirmModal: white 카드 / radius 24 / 안쪽 여백 24,
 * 제목(title-md)과 본문(body-md) 사이 16, 본문과 버튼 줄 사이 22.
 * 버튼은 오른쪽 정렬에 간격 8이고 md 크기를 쓴다.
 * 취소 버튼은 시안 인스턴스에서 surface 배경을 덮어쓰고 있어 그대로 따랐다.
 *
 * 네이티브 Modal이 아니라 Portal로 띄우는 인트리 오버레이다.
 * RN의 Modal은 iOS에서 visible이 false가 돼도 dismiss 애니메이션이 끝날 때까지
 * 호스트 뷰가 트리에 남고(Modal.js의 _shouldShowModal), Android도 Dialog 윈도우를
 * 걷어내며 포커스를 돌려받는 동안 터치를 먹는다. 그래서 모달을 닫자마자 빠르게 탭하면
 * 첫 터치가 통째로 사라졌다. 오버레이는 닫기 시작하는 순간 pointerEvents를 none으로
 * 내려 아래로 터치를 흘려보낼 수 있어서, 사라지는 애니메이션 중에도 탭이 먹히지 않는다.
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

  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  // 애니메이션이 끝나야 트리에서 내린다
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  // 닫히는 동안에는 터치를 아래로 통과시킨다
  const [interactive, setInteractive] = useState(visible);

  useEffect(() => {
    if (visible) {
      mountedRef.current = true;
      setMounted(true);
      setInteractive(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }).start();
      return;
    }

    // 한 번도 열린 적 없으면 닫기 애니메이션을 돌릴 이유가 없다
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

  // 네이티브 Modal의 onRequestClose를 대신한다
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
        {/* 네이티브 Modal 창이 해주던 키보드 회피를 직접 해야 한다 */}
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
