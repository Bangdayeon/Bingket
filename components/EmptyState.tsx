import { View } from 'react-native';
import Button from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  /** 줄바꿈은 \n 으로 넣는다. */
  message: string;
  /** 다음 행동이 있을 때만 버튼을 붙인다. */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * 목록이 비었을 때의 안내. 화면마다 제각각 인라인으로 그리던 것을 하나로 모았다.
 * 에러와 빈 값은 사용자에게 전혀 다른 상황이므로 ErrorState와 반드시 구분해서 쓴다.
 */
export function EmptyState({ message, actionLabel, onAction, className = '' }: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center gap-6 px-4 py-10 ${className}`}>
      <Text className="text-center text-body-md text-gray-500">{message}</Text>
      {actionLabel && onAction && (
        <Button label={actionLabel} size="md" onClick={onAction} className="px-6" />
      )}
    </View>
  );
}
