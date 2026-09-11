import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

interface AutoHeightImageProps {
  uri: string;
  borderRadius?: number;
  marginTop?: number;
}

export function AutoHeightImage({ uri, borderRadius = 12, marginTop = 0 }: AutoHeightImageProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  return (
    <View
      style={{
        width: '100%',
        borderRadius,
        overflow: 'hidden',
        marginTop,
        minHeight: aspectRatio ? undefined : 180,
        aspectRatio: aspectRatio ?? undefined,
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
