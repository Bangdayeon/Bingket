import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { getCacheEncryptionKey } from './cache-key';

const DEFAULT_TTL_MS = 1000 * 60 * 3; // 기본 3분

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getCacheEncryptionKey();
  const sealed = await Crypto.aesEncryptAsync(new TextEncoder().encode(plaintext), key);
  return sealed.combined('base64');
}

async function decrypt(combined: string): Promise<string> {
  const key = await getCacheEncryptionKey();
  const sealed = Crypto.AESSealedData.fromCombined(combined);
  const bytes = await Crypto.aesDecryptAsync(sealed, key);
  return new TextDecoder().decode(bytes);
}

export async function getCache<T>(key: string, ttlMs = DEFAULT_TTL_MS): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const json = await decrypt(raw);
    const entry: CacheEntry<T> = JSON.parse(json);
    if (Date.now() - entry.cachedAt > ttlMs) return null;
    return entry.data;
  } catch {
    // 이전 버전(평문)으로 저장된 캐시이거나 복호화 실패 시 캐시 미스로 처리
    return null;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    const encrypted = await encrypt(JSON.stringify(entry));
    await AsyncStorage.setItem(key, encrypted);
  } catch {
    // ignore error
  }
}

export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore error
  }
}
