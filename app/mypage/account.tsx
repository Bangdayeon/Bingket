import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { useRouter } from 'expo-router';
import { ImageSourcePropType, Image, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '@/components/Modal';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchLinkedAccounts,
  LinkedAccount,
  resetMyBingos,
  deleteAccount,
} from '@/features/mypage/lib/mypage';
import Loading from '@/components/Loading';

const PROVIDER_CONFIG: Record<
  string,
  { label: string; bgColor: string; logo: ImageSourcePropType }
> = {
  google: {
    label: 'Google',
    bgColor: '#FFFFFF',
    logo: require('@/assets/icons/google_logo.png'),
  },
  apple: {
    label: 'Apple',
    bgColor: '#000000',
    logo: require('@/assets/icons/apple_logo.png'),
  },
  kakao: {
    label: '카카오톡',
    bgColor: '#FEE500',
    logo: require('@/assets/icons/kakao_logo.png'),
  },
};

interface RowItemProps {
  label: string;
  onPress: () => void;
}

function RowItem({ label, onPress }: RowItemProps) {
  const iconColor = '#181C1C'; /* gray-100 : gray-900 */
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between px-5 py-4">
      <Text className="text-title-sm">{label}</Text>
      <View style={{ transform: [{ rotate: '180deg' }] }}>
        <BackArrowIcon width={20} height={20} color={iconColor} />
      </View>
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSecessionModal, setShowSecessionModal] = useState(false);
  const [showResetDoneModal, setShowResetDoneModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLinkedAccounts().then(setAccounts);
  }, []);

  const handleResetBingos = async () => {
    setShowResetModal(false);
    setLoading(true);
    try {
      await resetMyBingos();
      await AsyncStorage.removeItem('@bingket/draft-bingo');
      setShowResetDoneModal(true);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '다시 시도해주세요.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowSecessionModal(false);
    setLoading(true);
    try {
      await deleteAccount();
      // _layout.tsx의 onAuthStateChange가 SIGNED_OUT 이벤트를 받아 login으로 이동
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '다시 시도해주세요.');
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white  " style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300  ">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">계정 관리</Text>
        <View className="w-8" />
      </View>

      {/* 연동 계정 정보 */}
      <View className="px-5 pt-6 pb-4">
        <Text className="text-title-sm mb-4">연동 계정 정보</Text>
        {accounts.length === 0 ? (
          <Loading color="#6ADE50" />
        ) : (
          accounts.map((account) => {
            const cfg = PROVIDER_CONFIG[account.provider];
            return (
              <View key={account.provider} className="flex-row items-center gap-3 mb-3">
                <View
                  className="w-6 h-6 rounded-md items-center justify-center border border-gray-200  "
                  style={{ backgroundColor: cfg?.bgColor ?? '#EEEEEE' }}
                >
                  {cfg?.logo && (
                    <Image
                      source={cfg.logo}
                      style={{ width: 14, height: 14 }}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <Text className="text-title-sm">{cfg?.label ?? account.provider}</Text>
                <Text className="text-title-sm text-gray-500   ml-auto">
                  {account.email?.endsWith('@kakao.bingket') ? '' : (account.email ?? '')}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View className="h-px bg-gray-200   mx-5 my-2" />

      {loading ? (
        <View className="py-6 items-center">
          <Loading color="#6ADE50" />
        </View>
      ) : (
        <>
          <RowItem label="빙고 초기화" onPress={() => setShowResetModal(true)} />
          <RowItem label="회원 탈퇴" onPress={() => setShowSecessionModal(true)} />
        </>
      )}

      {/* 빙고 초기화 확인 모달 */}
      <Modal
        visible={showResetModal}
        title="정말로 빙고를 초기화 하시겠어요?"
        body={`• 작성한 모든 빙고가 삭제돼요.\n• 글과 댓글은 남아요.\n• 계정과 프로필은 유지돼요.`}
        variant="warning"
        cancelLabel="취소하기"
        confirmLabel="빙고 초기화 하기"
        onCancel={() => setShowResetModal(false)}
        onConfirm={handleResetBingos}
        onDismiss={() => setShowResetModal(false)}
      />

      {/* 빙고 초기화 완료 모달 */}
      <Modal
        visible={showResetDoneModal}
        title="초기화 완료"
        body="모든 빙고가 삭제되었어요."
        variant="single"
        confirmLabel="확인"
        onConfirm={() => {
          setShowResetDoneModal(false);
          router.back();
        }}
        onDismiss={() => {
          setShowResetDoneModal(false);
          router.back();
        }}
      />

      {/* 회원 탈퇴 모달 */}
      <Modal
        visible={showSecessionModal}
        title="정말로 탈퇴를 하시겠어요?"
        body={`• 계정이 완전히 삭제돼요.\n• 계정 삭제 후 데이터 복구가 불가능해요.\n• 작성한 글과 댓글은 (알 수 없음)으로 남아요`}
        variant="warning"
        cancelLabel="취소하기"
        confirmLabel="회원 탈퇴하기"
        onCancel={() => setShowSecessionModal(false)}
        onConfirm={handleDeleteAccount}
        onDismiss={() => setShowSecessionModal(false)}
      />

      {/* 오류 모달 */}
      <Modal
        visible={showErrorModal}
        title="오류가 발생했어요"
        body={errorMessage}
        variant="single"
        confirmLabel="확인"
        onConfirm={() => setShowErrorModal(false)}
        onDismiss={() => setShowErrorModal(false)}
      />
    </View>
  );
}
