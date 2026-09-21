import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useTranslation } from 'react-i18next';

export const PROFILE_TABS = ['feed', 'badge'] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

interface Props {
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  feedCount?: number;
  className?: string;
}

export function ProfileTabs({ value, onChange, feedCount, className = '' }: Props) {
  const { t } = useTranslation();
  return (
    <View className={`flex-row gap-6 border-b border-gray-300 px-4 ${className}`}>
      {PROFILE_TABS.map((tab) => (
        <Pressable key={tab} onPress={() => onChange(tab)} className="items-center pt-3">
          <View className="flex-row items-baseline gap-1">
            <Text
              className={
                value === tab
                  ? 'text-body-md font-pretendard-bold text-gray-800'
                  : 'text-body-md font-pretendard-medium text-gray-400'
              }
            >
              {t(`my.${tab}`)}
            </Text>
            {tab === 'feed' && feedCount !== undefined && (
              <Text className="text-caption-sm text-gray-700">{feedCount}</Text>
            )}
          </View>
          <View
            className={`-mb-px mt-2 h-[1.5px] w-11 ${value === tab ? 'bg-gray-800' : 'bg-transparent'}`}
          />
        </Pressable>
      ))}
    </View>
  );
}
