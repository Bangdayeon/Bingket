import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * 사진 라이브러리를 열기 전에 필요한 권한을 확보한다. 허용됐으면 true.
 *
 * Android에서는 권한을 요청하지 않고 항상 true를 반환한다.
 * `launchImageLibraryAsync`는 안드로이드에서 시스템 사진 선택 도구(Android 13+는
 * `PickVisualMedia`, 그 이하는 SAF 문서 선택기)를 띄우고, 이 선택 도구는 사용자가 직접
 * 고른 항목의 URI만 앱에 넘겨준다. 즉 READ_MEDIA_IMAGES 같은 광범위한 사진/동영상 권한이
 * 애초에 필요 없다. 오히려 그런 권한을 선언하거나 요청하면 Google Play의
 * "사진 및 동영상 권한" 정책(승인된 핵심 기능이 없으면 시스템 사진 선택 도구를 써야 함)
 * 위반으로 심사에서 거절된다.
 *
 * iOS는 PHPicker 자체에는 권한이 필요 없지만, 기존 동작(사용자가 앨범 접근을 미리 허용/거부)을
 * 유지하기 위해 그대로 요청한다.
 */
export const ensurePhotoLibraryPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return true;
  }
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return granted;
};
