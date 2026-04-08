import { View } from 'react-native';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import CloseIcon from '@/assets/icons/ic_close.svg';
import { ProfileAvatar } from '@/components/ProfileAvatar';

type Variant = 'sent' | 'rejected' | 'received';

interface BattleNotificationProps {
  variant: Variant;
  bingoTitle: string;
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
  bingoTitle,
  friendName,
  friendUsername,
  avatarUrl,
  onCancel,
  onClose,
  onAccept,
  onReject,
}: BattleNotificationProps) {
  const isGreen = variant === 'sent' || variant === 'received';

  const containerStyle = isGreen ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200';

  const renderHeader = () => {
    switch (variant) {
      case 'sent':
        return (
          <>
            <Text className="text-body-md">대결 요청을 보냈어요.</Text>
            <Button
              className="h-8 px-4"
              variant="dangerous"
              label="취소"
              onClick={onCancel ?? (() => {})}
            />
          </>
        );

      case 'rejected':
        return (
          <>
            <Text className="text-body-md">친구가 대결 요청을 거절했어요.</Text>
            <CloseIcon width={20} height={20} onPress={onClose} />
          </>
        );

      case 'received':
        return (
          <>
            <Text className="text-body-md">대결 요청을 받았어요.</Text>
            <View className="flex-row gap-2">
              <Button
                className="h-8 px-4"
                variant="dangerous"
                label="거절"
                onClick={onReject ?? (() => {})}
              />
              <Button className="h-8 px-4" label="승인" onClick={onAccept ?? (() => {})} />
            </View>
          </>
        );
    }
  };

  return (
    <View className={`py-3 px-5 gap-1 border-b ${containerStyle}`}>
      {/* header */}
      <View className="flex-row justify-between items-center">{renderHeader()}</View>

      {/* bingo title */}
      <Text className="text-title-sm">{bingoTitle}</Text>

      {/* user info */}
      <View className="flex-row gap-2 items-center">
        <ProfileAvatar size={20} avatarUrl={avatarUrl} />
        <View className="flex-row gap-1 items-center">
          <Text className="text-body-sm">{friendName}</Text>
          <Text className="text-[11px] text-gray-700">@{friendUsername}</Text>
        </View>
      </View>
    </View>
  );
}
