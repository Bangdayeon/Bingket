import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';

export const PROFILE_TABS = ['피드', '뱃지'] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

interface Props {
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  /** '피드' 옆에 붙는 빙고 개수. 아직 못 불러왔으면 비워 둔다 — 0 이 잠깐 스치는 걸 막는다. */
  feedCount?: number;
  className?: string;
}

/** 내 공간과 타인 프로필이 같은 탭을 쓴다. 시안: 밑줄 44×1.5. */
export function ProfileTabs({ value, onChange, feedCount, className = '' }: Props) {
  return (
    <View className={`flex-row gap-6 border-b border-gray-300 px-4 ${className}`}>
      {PROFILE_TABS.map((tab) => (
        <Pressable key={tab} onPress={() => onChange(tab)} className="items-center pt-3">
          {/* 개수는 라벨보다 한 단 작게, 선택 여부와 무관하게 같은 색으로 둔다 */}
          <View className="flex-row items-baseline gap-1">
            <Text
              className={
                value === tab
                  ? 'text-body-md font-pretendard-bold text-gray-800'
                  : 'text-body-md font-pretendard-medium text-gray-400'
              }
            >
              {tab}
            </Text>
            {tab === '피드' && feedCount !== undefined && (
              <Text className="text-caption-sm text-gray-700">{feedCount}</Text>
            )}
          </View>
          {/* 하단 패딩을 두지 않고 -mb-px로 내려, 아래 구분선 위에 겹쳐 앉게 한다.
              패딩이 있으면 밑줄만 공중에 뜬 줄로 보인다. */}
          <View
            className={`-mb-px mt-2 h-[1.5px] w-11 ${value === tab ? 'bg-gray-800' : 'bg-transparent'}`}
          />
        </Pressable>
      ))}
    </View>
  );
}
