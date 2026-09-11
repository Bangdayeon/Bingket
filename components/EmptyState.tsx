import { View } from 'react-native';
import Button from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  message: string; // with \n
  actionLabel?: string;
  onAction?: () => void;
  align?: 'center' | 'top';
  className?: string;
}
export function EmptyState({
  message,
  actionLabel,
  onAction,
  align = 'center',
  className = '',
}: EmptyStateProps) {
  const alignClass = align === 'top' ? 'justify-start pt-24' : 'justify-center';

  return (
    <View className={`flex-1 items-center gap-6 px-4 py-10 ${alignClass} ${className}`}>
      <Text className="text-center text-body-md text-gray-500">{message}</Text>
      {actionLabel && onAction && (
        <Button label={actionLabel} size="md" onClick={onAction} className="px-6" />
      )}
    </View>
  );
}
