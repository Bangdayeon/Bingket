import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import Constants from 'expo-constants';
import { ScrollView, View, Platform, Linking } from 'react-native';
import { Text } from '@/components/Text';
import { MenuItem } from './MenuItem';
import { Modal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { deletePushToken } from '@/lib/push-notifications';
import { clearNotificationSettingsCache } from '@/features/mypage/lib/notification-settings';
import { submitReport } from '@/features/mypage/lib/mypage';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { Toast } from '@/components/Toast';

import { TextInput } from '@/components/TextInput';
import { ANDROID_PACKAGE_NAME, IOS_APP_ID } from '@/constants/store';

export function SettingsMenu() {
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const navigate = (path: Parameters<typeof router.push>[0]) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(path);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [resultModal, setResultModal] = useState<{ title: string; body: string } | null>(null);
  const [reportInputText, setReportInputText] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [emailToastVisible, setEmailToastVisible] = useState(false);

  const openUrl = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  /**
   * canOpenURL 로 먼저 물어보지 않는다.
   * AndroidManifest 의 <queries> 에 market 스킴이 없어서 Android 11+ 에서는
   * 스토어가 깔려 있어도 무조건 false 가 나온다 (패키지 가시성).
   * openURL 은 그 선언이 필요 없고 처리할 앱이 없으면 throw 하므로,
   * 스토어 앱을 먼저 시도하고 실패할 때만 웹으로 내려간다.
   */
  const openReviewPage = async () => {
    const isAndroid = Platform.OS === 'android';
    const url = isAndroid
      ? `market://details?id=${ANDROID_PACKAGE_NAME}`
      : `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`;
    const fallback = isAndroid
      ? `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`
      : `https://apps.apple.com/kr/app/id${IOS_APP_ID}?action=write-review`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Sentry.captureException(error);
      await Linking.openURL(fallback).catch(Sentry.captureException);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    // RLS 때문에 세션이 살아있는 동안에만 토큰을 지울 수 있다
    await deletePushToken();
    // 남겨두면 다음에 로그인한 계정의 알림 설정 화면에 이전 사용자 값이 뜬다
    await clearNotificationSettingsCache();
    await supabase.auth.signOut();
  };

  const handleReport = async () => {
    if (!reportInputText.trim()) return;
    setIsReportLoading(true);
    try {
      await submitReport(reportInputText);
      setShowAskModal(false);
      setReportInputText('');
      setResultModal({
        title: '문의가 접수되었습니다',
        body: '빠른 시간 내에 검토 후 조치하겠습니다.',
      });
    } catch (e) {
      Sentry.captureException(e);
      setResultModal({ title: '오류', body: '문의 접수에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsReportLoading(false);
    }
  };

  return (
    <>
      <ScrollView className="flex-1 bg-surface md:w-full md:max-w-[600px] md:self-center">
        <View className="gap-3 px-4 py-3">
          <MenuItem
            label="프로필 편집"
            onPress={() => navigate('/mypage/profile-edit')}
            showArrow
          />
          <MenuItem label="계정 관리" onPress={() => navigate('/mypage/account')} showArrow />
          <MenuItem label="알림 설정" onPress={() => navigate('/mypage/alert-setting')} showArrow />
          <MenuItem label="앱 테마" onPress={() => navigate('/mypage/app-theme')} showArrow />
        </View>

        <View className="h-px bg-gray-300" />

        <View className="gap-3 px-4 py-3">
          <MenuItem label="앱 리뷰 남기기" onPress={openReviewPage} />
          <MenuItem
            label="자주 묻는 질문"
            onPress={() =>
              openUrl(
                'https://aback-shirt-867.notion.site/32eadd99c04280feb05bd33b3e011d0f?source=copy_link',
              )
            }
          />
          <MenuItem
            label="이용 약관"
            onPress={() =>
              openUrl(
                'https://aback-shirt-867.notion.site/32eadd99c0428005b2e0e2437d6cd91a?source=copy_link',
              )
            }
          />
          <MenuItem
            label="개인정보 처리방침"
            onPress={() =>
              openUrl(
                'https://aback-shirt-867.notion.site/32eadd99c04280558920e3c684d4bd9a?source=copy_link',
              )
            }
          />
          <MenuItem
            label="업데이트 내역"
            onPress={() =>
              openUrl(
                'https://aback-shirt-867.notion.site/32eadd99c04280b9843ded4a5c8f3fff?source=copy_link',
              )
            }
          />
          <MenuItem label="빠른 문의" onPress={() => setShowAskModal(true)} showArrow />
        </View>

        <View className="h-px bg-gray-300" />

        {/* 시안: 개발자 이메일이 버전 정보보다 위이고, 둘은 별도 구획이다 */}
        <View className="gap-3 px-4 py-3">
          <MenuItem
            label="개발자 이메일"
            onPress={async () => {
              await Clipboard.setStringAsync('dybang00@gmail.com');
              setEmailToastVisible(true);
            }}
            rightText="dybang00@gmail.com"
          />
          <MenuItem
            label="버전 정보"
            onPress={() => {}}
            rightText={`v ${Constants.expoConfig?.version}`}
          />
        </View>

        <View className="h-px bg-gray-300" />

        <View className="gap-3 px-4 py-3">
          <MenuItem label="로그아웃" muted onPress={() => setShowLogoutModal(true)} />
        </View>
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
        <Modal
          visible={resultModal !== null}
          title={resultModal?.title ?? ''}
          body={resultModal?.body}
          variant="single"
          confirmLabel="확인"
          onConfirm={() => setResultModal(null)}
        />
        {/* 빠른 문의 모달 */}
        <Modal
          visible={showAskModal}
          title="문의/신고하기"
          confirmLabel="제출"
          cancelLabel="취소"
          confirmDisabled={!reportInputText.trim()}
          confirmLoading={isReportLoading}
          onConfirm={() => void handleReport()}
          onCancel={() => {
            setShowAskModal(false);
            setReportInputText('');
          }}
          onDismiss={() => {
            setShowAskModal(false);
            setReportInputText('');
          }}
          body={
            <View>
              <TextInput
                value={reportInputText}
                onChangeText={(v) => setReportInputText(v.slice(0, 500))}
                placeholder="문의/신고하실 내용을 입력하세요."
                maxLength={500}
                maxHeight={120}
                className="min-h-[72px]"
                style={{ textAlignVertical: 'top' }}
              />
              <Text className="text-caption-md text-gray-400   text-right mt-1">
                {reportInputText.length}/500
              </Text>
            </View>
          }
        />
      </ScrollView>
      <Toast
        message="이메일이 복사되었습니다."
        visible={emailToastVisible}
        onDismiss={() => setEmailToastVisible(false)}
      />
    </>
  );
}
