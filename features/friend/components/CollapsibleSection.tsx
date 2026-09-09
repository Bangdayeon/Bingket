import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import ArrowForwardIcon from '@/assets/icons/ic_arrow_forward.svg';
import { Text } from '@/components/Text';

interface CollapsibleSectionProps {
  title: string;
  /** 제목 옆에 붙는 개수. 없으면 안 그린다. */
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** 제목 옆 `>` 를 눌러 접었다 펴는 목록 구획. 펼치면 화살표가 아래를 본다. */
export function CollapsibleSection({
  title,
  count,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        className="flex-row items-center gap-1 px-4 pb-2 pt-4"
      >
        <Text className="text-title-sm font-pretendard-semibold text-gray-900">{title}</Text>
        {count !== undefined && <Text className="text-body-md text-gray-600">{count}</Text>}
        <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
          <ArrowForwardIcon width={24} height={24} color="#2E3333" /* gray-800 */ />
        </View>
      </Pressable>

      {expanded && children}
    </View>
  );
}
