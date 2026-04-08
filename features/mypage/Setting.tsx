import * as Sentry from '@sentry/react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import Constants from 'expo-constants';
import { ActivityIndicator, Pressable, ScrollView, View, Platform, Linking } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Text } from '@/components/Text';
import { MenuItem } from './MenuItem';
import { Modal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { fetchMyProfile, MyProfile } from '@/features/mypage/lib/mypage';
import * as WebBrowser from 'expo-web-browser';
import { getCache, setCache } from '@/lib/cache';

import Profile from '@/assets/pngIcons/profile.png';
import Account from '@/assets/pngIcons/account.png';
import Notification from '@/assets/pngIcons/notification.png';
import Review from '@/assets/pngIcons/review.png';
import FAQ from '@/assets/pngIcons/faq.png';
import Terms from '@/assets/pngIcons/terms.png';
import Privacy from '@/assets/pngIcons/privacy.png';
import Update from '@/assets/pngIcons/update.png';
import { CACHE_KEY_PROFILE } from '@/constants/cache_key';
import { PROFILE_TTL } from '@/constants/cache_key';

export function SettingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const ANDROID_PACKAGE_NAME = 'com.my.app'; // TODO
  const IOS_APP_ID = '1234567890'; // TODO

  useFocusEffect(
    useCallback(() => {
      getCache<MyProfile>(CACHE_KEY_PROFILE, PROFILE_TTL).then((cached) => {
        if (cached) setProfile(cached);
        // 백그라운드에서 갱신
        fetchMyProfile().then((fresh) => {
          if (fresh) {
            setProfile(fresh);
            setCache(CACHE_KEY_PROFILE, fresh);
          }
        });
      });
    }, []),
  );

  const openUrl = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const openReviewPage = async () => {
    try {
      if (Platform.OS === 'android') {
        const url = `market://details?id=${ANDROID_PACKAGE_NAME}`;
        const fallback = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;
        const supported = await Linking.canOpenURL(url);
        await Linking.openURL(supported ? url : fallback);
      } else {
        const url = `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`;
        await Linking.openURL(url);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
  };

  return (
    <ScrollView className="flex-1 mt-[52px] bg-white px-5 dark:bg-gray-900">
      <View className="h-5" />
      {/* 프로필 영역 */}
      <View className="flex-row items-start mb-5  gap-4 h-[100px]">
        <ProfileAvatar avatarUrl={profile?.avatarUrl} />
        <View className="flex-1 pt-1 flex flex-col justify-between h-full">
          <View>
            {profile ? (
              <>
                <Text className="text-title-sm mb-1">{profile.displayName}</Text>
                <Text className="text-body-sm">{profile.username}</Text>
              </>
            ) : (
              <ActivityIndicator size="small" />
            )}
          </View>
          <View className="flex-row gap-8">
            <View className="flex-row gap-3 mb-2">
              <Pressable onPress={() => router.push('/mypage/my-posts')}>
                <Text className="text-body-sm">게시글 {profile?.feedCount ?? 0}</Text>
              </Pressable>
            </View>
            <View className="flex-row gap-3 mb-2">
              <Pressable onPress={() => router.push('/mypage/friend-list')}>
                <Text className="text-body-sm">친구 {profile?.friendCount ?? 0}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
      <View className="mb-3">
        <Text className="text-label-sm">한 줄 다짐</Text>
        <Text className="text-caption-md">{profile?.bio || '아직 한 줄 다짐이 없어요.'}</Text>
      </View>

      <View className="h-px bg-gray-200 dark:bg-gray-700" />

      <MenuItem
        imgSrc={Profile}
        label="프로필 편집"
        onPress={() => router.push('/mypage/profile-edit')}
        showArrow
      />
      <MenuItem
        imgSrc={Account}
        label="계정 관리"
        onPress={() => router.push('/mypage/account')}
        showArrow
      />
      <MenuItem
        imgSrc={Notification}
        label="알림 설정"
        onPress={() => router.push('/mypage/alert-setting')}
        showArrow
      />
      {/* <MenuItem imgSrc={Theme} label="앱 테마" onPress={() => router.push('/mypage/app-theme')} showArrow /> */}

      <View className="h-px bg-gray-200 dark:bg-gray-700" />

      <MenuItem imgSrc={Review} label="앱 리뷰하러 하기" onPress={openReviewPage} />
      <MenuItem
        imgSrc={FAQ}
        label="자주 묻는 질문"
        onPress={() =>
          openUrl(
            'https://aback-shirt-867.notion.site/32eadd99c04280feb05bd33b3e011d0f?source=copy_link',
          )
        }
      />
      <MenuItem
        imgSrc={Terms}
        label="이용 약관"
        onPress={() =>
          openUrl(
            'https://aback-shirt-867.notion.site/32eadd99c0428005b2e0e2437d6cd91a?source=copy_link',
          )
        }
      />
      <MenuItem
        imgSrc={Privacy}
        label="개인정보 처리방침"
        onPress={() =>
          openUrl(
            'https://aback-shirt-867.notion.site/32eadd99c04280558920e3c684d4bd9a?source=copy_link',
          )
        }
      />
      <MenuItem
        imgSrc={Update}
        label="업데이트 내역"
        onPress={() =>
          openUrl(
            'https://aback-shirt-867.notion.site/32eadd99c04280b9843ded4a5c8f3fff?source=copy_link',
          )
        }
      />
      <MenuItem
        label="버전 정보"
        onPress={() => {}}
        rightText={`v ${Constants.expoConfig?.version ?? '1.0.0'}`}
      />

      <View className="h-px bg-gray-200 dark:bg-gray-700" />

      <MenuItem label="로그아웃" onPress={() => setShowLogoutModal(true)} />
      <View className="h-40" />

      <Modal
        visible={showLogoutModal}
        title="로그아웃 하시겠어요?"
        variant="warning"
        cancelLabel="취소"
        confirmLabel="로그아웃"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        onDismiss={() => setShowLogoutModal(false)}
      />
    </ScrollView>
  );
}
