import type { RefObject } from 'react';
import type { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import type { TFunction } from 'i18next';

interface CaptureSize {
  width: number;
  height: number;
}

export async function shareBingoBoard(
  ref: RefObject<View | null>,
  title: string,
  size: CaptureSize,
  t: TFunction,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(t('friends.error.usage'));
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
    dialogTitle: `${title} ${t('bingo.board')}`,
  });
}
