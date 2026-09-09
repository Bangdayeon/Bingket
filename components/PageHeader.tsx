import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { Text } from './Text';

interface PageHeaderProps {
  /** 없으면 뒤로가기 줄만 그린다. */
  title?: string;
  /** 제목 오른쪽에 붙는 것 — 친구 수, D-N 등. */
  titleRight?: ReactNode;
  /** 뒤로가기 줄 오른쪽 액션 — 삭제 아이콘, 더보기 등. */
  right?: ReactNode;
  onBack?: () => void;
  hideBack?: boolean;
}

/**
 * 시안의 공통 화면 헤더. 상태바(46) 아래 12px에 뒤로가기 24px,
 * 그 28px 아래에 좌측 정렬 대형 제목(title-lg 24/30 Medium)이 온다.
 * 중앙 정렬 제목이나 하단 구분선은 시안에 없다.
 * 화면 쪽에서 `paddingTop: insets.top`을 준 컨테이너 안에 넣어 쓴다.
 */
export function PageHeader({
  title,
  titleRight,
  right,
  onBack,
  hideBack = false,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <View>
      <View className="h-9 flex-row items-center justify-between px-4 pt-3">
        {hideBack ? (
          <View />
        ) : (
          <Pressable onPress={onBack ?? (() => router.back())} hitSlop={12}>
            <BackArrowIcon width={24} height={24} className="text-gray-900" />
          </Pressable>
        )}
        {right}
      </View>

      {title ? (
        <View className="flex-row items-center gap-2 px-4 pb-2 pt-7">
          <Text className="text-title-lg font-pretendard-medium text-gray-900">{title}</Text>
          {titleRight}
        </View>
      ) : null}
    </View>
  );
}
