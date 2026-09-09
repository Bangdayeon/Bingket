import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import type { AccountVisibility } from '@/features/profile/lib/profile';

// 시안 순서: 전체 공개 → 친구 공개 → 비공개
const OPTIONS: { value: AccountVisibility; label: string; description: string }[] = [
  {
    value: 'public',
    label: '전체 공개',
    description: '내가 작성한 빙고와 글을 모두가 볼 수 있어요.',
  },
  {
    value: 'friends',
    label: '친구 공개',
    description: '내가 작성한 빙고와 글을 친구만 볼 수 있어요.',
  },
  {
    value: 'private',
    label: '비공개',
    description: '내가 작성한 빙고와 글을 나만 볼 수 있고, 아이디로 검색되지 않아요.',
  },
];

interface Props {
  value: AccountVisibility;
  onChange: (value: AccountVisibility) => void;
  disabled?: boolean;
}

/**
 * 시안: gray-200 트랙(358×44, r12) 위에 108×36 세그먼트 세 개.
 * 고른 것만 흰 배경 + 테두리로 떠 보이고, 아래에 설명 한 줄이 바뀐다.
 */
export function AccountVisibilitySelector({ value, onChange, disabled = false }: Props) {
  const selected = OPTIONS.find((opt) => opt.value === value) ?? OPTIONS[1];

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
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="pt-3 text-caption-md text-gray-900">{selected.description}</Text>
    </View>
  );
}
