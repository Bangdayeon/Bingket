import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import CloseIcon from '@/assets/icons/ic_close.svg';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import ArrowForward from '@/assets/icons/ic_arrow_forward.svg';

type Variant = 'sent' | 'rejected' | 'received';

type HeaderConfig = {
  title: string;
  actions?: React.ReactNode;
};

interface BattleNotificationProps {
  variant: Variant;
  requestId: string;
  friendName: string;
  friendUsername: string;
  avatarUrl?: string | null;

  // actions
  onCancel?: () => void; // sent
  onClose?: () => void; // rejected
  onAccept?: () => void; // received
  onReject?: () => void; // received
}

export function BattleNotification({
  variant,
  requestId,
  friendName,
  friendUsername,
  avatarUrl,
  onCancel,
  onClose,
  onAccept,
  onReject,
}: BattleNotificationProps) {
  const router = useRouter();
  const isGreen = variant === 'sent' || variant === 'received';
  const containerStyle = isGreen ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200';

  const handleCheckBattle = () => {
    router.push({
      pathname: '/bingo/semi-battle-check',
      params: {
        requestId,
        variant,
        friendName,
        friendUsername,
        friendAvatarUrl: avatarUrl ?? '',
      },
    });
  };

  const getHeaderConfig = (): HeaderConfig => {
    switch (variant) {
      case 'sent':
        return {
          title: '대결 요청을 보냈어요.',
          actions: (
            <Button
              className="h-[36px]"
              variant="dangerous"
              label="요청 취소하기"
              onClick={onCancel ?? (() => {})}
            />
          ),
        };

      case 'rejected':
        return {
          title: '친구가 대결 요청을 거절했어요.',
          actions: <CloseIcon width={20} height={20} onPress={onClose} />,
        };

      case 'received':
        return {
          title: '대결 요청을 받았어요.',
          actions: (
            <View className="flex-row gap-2">
              <Button
                className="w-[50%] h-[36px]"
                variant="dangerous"
                label="거절"
                onClick={onReject ?? (() => {})}
              />
              <Button className="w-[50%] h-[36px]" label="승인" onClick={onAccept ?? (() => {})} />
            </View>
          ),
        };
    }
  };

  return (
    <View className={`py-3 px-5 gap-2 border-b ${containerStyle}`}>
      {/* header */}
      <View className="flex-row justify-between items-center">
        <Text className="text-title-sm font-pretendard-medium">{getHeaderConfig().title}</Text>
      </View>

      {/* user info */}
      <View className="flex-row gap-2 items-center">
        <ProfileAvatar size={20} avatarUrl={avatarUrl} />
        <View className="flex-row gap-1 items-center">
          <Text className="text-body-sm">{friendName}</Text>
          <Text className="text-[11px] text-gray-700">@{friendUsername}</Text>
        </View>
      </View>

      {variant !== 'rejected' && (
        <TouchableOpacity
          className="w-full justify-between items-center flex-row"
          onPress={handleCheckBattle}
        >
          <Text>대결장 확인하기</Text>
          <ArrowForward width={18} height={18} color="#2E3333" />
        </TouchableOpacity>
      )}

      <View className="mt-3">{getHeaderConfig().actions}</View>
    </View>
  );
}
