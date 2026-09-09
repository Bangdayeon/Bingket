import { View } from 'react-native';
import Button from './Button';
import { Text } from './Text';

interface ErrorStateProps {
  /** 원인을 아는 경우에만 바꾼다. 기본 문구는 원인을 특정하지 않는다. */
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const DEFAULT_MESSAGE = '불러오지 못했어요\n잠시 후 다시 시도해주세요';

/**
 * 조회 실패 안내 + 재시도. 지금까지는 실패해도 빈 목록으로 보이거나
 * 스피너가 계속 돌아서, 다시 시도할 방법이 화면을 나갔다 들어오는 것뿐이었다.
 */
export function ErrorState({
  message = DEFAULT_MESSAGE,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <View className={`flex-1 items-center justify-center gap-6 px-4 py-10 ${className}`}>
      <Text className="text-center text-body-md text-gray-500">{message}</Text>
      {onRetry && (
        <Button
          label="다시 시도"
          size="md"
          variant="secondary"
          onClick={onRetry}
          className="px-6"
        />
      )}
    </View>
  );
}
