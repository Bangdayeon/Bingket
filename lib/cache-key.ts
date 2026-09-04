import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// SecureStore 키는 [\w.-]+ 만 허용해 AsyncStorage의 `@bingket/` 프리픽스를 쓸 수 없음
const CACHE_ENCRYPTION_KEY_STORAGE_KEY = 'bingket_cache_encryption_key';

let cacheEncryptionKeyPromise: Promise<Crypto.AESEncryptionKey> | null = null;

async function loadOrCreateCacheEncryptionKey(): Promise<Crypto.AESEncryptionKey> {
  const stored = await SecureStore.getItemAsync(CACHE_ENCRYPTION_KEY_STORAGE_KEY);
  if (stored) {
    return Crypto.AESEncryptionKey.import(stored, 'base64');
  }

  const key = await Crypto.AESEncryptionKey.generate(Crypto.AESKeySize.AES256);
  const encoded = await key.encoded('base64');
  await SecureStore.setItemAsync(CACHE_ENCRYPTION_KEY_STORAGE_KEY, encoded);
  return key;
}

export function getCacheEncryptionKey(): Promise<Crypto.AESEncryptionKey> {
  if (!cacheEncryptionKeyPromise) {
    cacheEncryptionKeyPromise = loadOrCreateCacheEncryptionKey();
  }
  return cacheEncryptionKeyPromise;
}
