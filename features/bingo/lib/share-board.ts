import type { RefObject } from 'react';
import type { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

interface CaptureSize {
  width: number;
  height: number;
}

export async function shareBingoBoard(
  ref: RefObject<View | null>,
  title: string,
  size: CaptureSize,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('이 기기에서는 공유 시트를 쓸 수 없어요.');
  }

  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: size.width,
    height: size.height,
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: `${title} 빙고판`,
  });
}
