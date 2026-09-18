import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import type { AccountVisibility } from '@/features/profile/lib/profile';
import { useTranslation } from 'react-i18next';

const OPTIONS = [
  {
    value: 'public',
    label: 'settings.account.public',
    description: 'settings.account.public_des',
  },
  {
    value: 'friends',
    label: 'settings.account.friends',
    description: 'settings.account.friends_des',
  },
  {
    value: 'private',
    label: 'settings.account.private',
    description: 'settings.account.private_des', // 마침표도 제거
  },
] as const satisfies { value: AccountVisibility; label: string; description: string }[];

interface Props {
  value: AccountVisibility;
  onChange: (value: AccountVisibility) => void;
  disabled?: boolean;
}

export function AccountVisibilitySelector({ value, onChange, disabled = false }: Props) {
  const { t } = useTranslation();
  const selected = OPTIONS.find((opt) => opt.value === value) ?? OPTIONS[0];

  return (
    <View>
      <View
        className={`h-11 flex-row items-center gap-1 rounded-xl bg-gray-200 p-1 ${
          disabled ? 'opacity-40' : ''
        }`}
      >
        {OPTIONS.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              disabled={disabled}
              className={`h-9 flex-1 items-center justify-center rounded-[10px] ${
                isSelected ? 'border border-gray-300 bg-white' : ''
              }`}
            >
              <Text
                className={`text-label-sm ${
                  isSelected ? 'font-pretendard-semibold text-gray-800' : 'text-gray-600'
                }`}
              >
                {t(opt.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="pt-3 text-caption-md text-gray-900"> {t(selected.description)}</Text>
    </View>
  );
}
