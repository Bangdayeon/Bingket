import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import Constants from 'expo-constants';
import { ScrollView, View, Platform, Linking } from 'react-native';
import { Text } from '@/components/Text';
import { MenuItem } from './MenuItem';
import { Modal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { submitReport } from '@/features/mypage/lib/mypage';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { Toast } from '@/components/Toast';

import Profile from '@/assets/pngIcons/profile.png';
import Account from '@/assets/pngIcons/account.png';
import Notification from '@/assets/pngIcons/notification.png';
import Review from '@/assets/pngIcons/review.png';
import FAQ from '@/assets/pngIcons/faq.png';
import Terms from '@/assets/pngIcons/terms.png';
import Privacy from '@/assets/pngIcons/privacy.png';
import Update from '@/assets/pngIcons/update.png';
import { TextInput } from '@/components/TextInput';

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

  const ANDROID_PACKAGE_NAME = 'com.day.bingket.app';
  const IOS_APP_ID = '6761634987';

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
      <ScrollView className="flex-1 bg-white px-5 md:self-center md:w-full md:max-w-[600px]">
        <View className="h-px bg-gray-200  " />

        <MenuItem
          imgSrc={Profile}
          label="프로필 편집"
          onPress={() => navigate('/mypage/profile-edit')}
          showArrow
        />
        <MenuItem
          imgSrc={Account}
          label="계정 관리"
          onPress={() => navigate('/mypage/account')}
          showArrow
        />
        <MenuItem
          imgSrc={Notification}
          label="알림 설정"
          onPress={() => navigate('/mypage/alert-setting')}
          showArrow
        />
        {/* <MenuItem imgSrc={Theme} label="앱 테마" onPress={() => router.push('/mypage/app-theme')} showArrow /> */}

        <View className="h-px bg-gray-200  " />

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
        <MenuItem label="빠른 문의" onPress={() => setShowAskModal(true)} showArrow />
        <MenuItem
          label="버전 정보"
          onPress={() => {}}
          rightText={`v ${Constants.expoConfig?.version}`}
        />
        <MenuItem
          label="개발자 이메일"
          onPress={async () => {
            await Clipboard.setStringAsync('dybang00@gmail.com');
            setEmailToastVisible(true);
          }}
          rightText="dybang00@gmail.com"
        />

        <View className="h-px bg-gray-200  " />

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
