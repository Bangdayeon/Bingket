import type { RefObject } from 'react';
import type { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

interface CaptureSize {
  width: number;
  height: number;
}

/**
 * 빙고판 영역만 PNG로 캡처해 시스템 공유 시트를 띄운다.
 *
 * 갤러리 저장은 사용자가 공유 시트에서 직접 고르게 한다. expo-media-library로 바로 저장하면
 * READ_MEDIA_* 권한을 매니페스트에 다시 선언하게 되는데, 그 권한들은 Google Play 사진 정책
 * 위반으로 심사에서 걷어냈고 app.json의 blockedPermissions가 막고 있다 (b6d1fcc, 754ed3c).
 * 공유 시트는 민감 권한이 전혀 필요 없다.
 */
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
