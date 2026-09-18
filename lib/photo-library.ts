import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export const ensurePhotoLibraryPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return true;
  }
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return granted;
};
