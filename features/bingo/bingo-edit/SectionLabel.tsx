import { View } from 'react-native';
import { Text } from '@/components/Text';

interface SectionLabelProps {
  label: string;
  /** 라벨 오른쪽에 붙는 작은 안내. 시안은 (i) 팝오버 대신 인라인 캡션을 쓴다. */
  hint?: string;
}

/** 빙고 작성·수정 폼의 구획 제목. 시안 기준 body-md(16/20) Regular. */
export function SectionLabel({ label, hint }: SectionLabelProps) {
  return (
    <View className="mb-4 flex-row items-center gap-2">
      <Text className="text-body-md text-gray-900">{label}</Text>
      {hint ? <Text className="text-caption-sm text-gray-500">{hint}</Text> : null}
    </View>
  );
}
