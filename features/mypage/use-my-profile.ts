import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getCache, setCache } from '@/lib/cache';
import { fetchMyProfile, type MyProfile } from '@/features/mypage/lib/mypage';
import { CACHE_KEY_PROFILE, PROFILE_TTL } from '@/constants/cache_key';

export function useMyProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getCache<MyProfile>(CACHE_KEY_PROFILE, PROFILE_TTL).then((cached) => {
        if (cached) setProfile(cached);
        fetchMyProfile().then((fresh) => {
          if (fresh) {
            setProfile(fresh);
            setCache(CACHE_KEY_PROFILE, fresh);
          }
        });
      });
    }, []),
  );

  return profile;
}
