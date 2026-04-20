import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

interface AutoHeightImageProps {
  uri: string;
  borderRadius?: number;
  marginTop?: number;
}

/**
 * 이미지 원본 비율 그대로 표시하는 컴포넌트.
 * onLoad에서 실제 width/height를 읽어 aspectRatio를 동적으로 적용한다.
 */
export function AutoHeightImage({ uri, borderRadius = 12, marginTop = 0 }: AutoHeightImageProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  return (
    <View
      style={{
        width: '100%',
        borderRadius,
        overflow: 'hidden',
        marginTop,
        // 로드 전에는 최소 높이 유지 (레이아웃 점프 최소화)
        minHeight: aspectRatio ? undefined : 180,
        aspectRatio: aspectRatio ?? undefined,
        backgroundColor: '#F2F2F2',
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        onLoad={(e) => {
          const { width, height } = e.source;
          if (width && height) setAspectRatio(width / height);
        }}
        cachePolicy="memory-disk"
      />
    </View>
  );
}
