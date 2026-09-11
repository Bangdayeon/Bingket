import { View } from 'react-native';
import Button from './Button';
import { Text } from './Text';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className = '' }: ErrorStateProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? `${t('common.error.general')} ${t('common.error.retry')}`;

  return (
    <View className={`flex-1 items-center justify-center gap-6 px-4 py-10 ${className}`}>
      <Text className="text-center text-body-md text-gray-500">{displayMessage}</Text>
      {onRetry && (
        <Button
          label={t('common.retry')}
          size="md"
          variant="secondary"
          onClick={onRetry}
          className="px-6"
        />
      )}
    </View>
  );
}
