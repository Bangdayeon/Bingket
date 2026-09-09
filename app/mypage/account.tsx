import { PageHeader } from '@/components/PageHeader';
import { FIXED, useColors } from '@/lib/use-colors';
import { useRouter } from 'expo-router';
import { ImageSourcePropType, Image, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '@/components/Modal';
import { useCallback, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchLinkedAccounts,
  LinkedAccount,
  resetMyBingos,
  deleteAccount,
} from '@/features/mypage/lib/mypage';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { AccountVisibilitySelector } from '@/features/mypage/components/AccountVisibilitySelector';
import {
  fetchMyProfileSummary,
  updateAccountVisibility,
  type AccountVisibility,
} from '@/features/profile/lib/profile';

const PROVIDER_CONFIG: Record<
  string,
  { label: string; bgColor: string; logo: ImageSourcePropType }
> = {
  google: {
    label: 'Google',
    bgColor: FIXED.fixedWhite,
    logo: require('@/assets/icons/google_logo.png'),
  },
  apple: {
    label: 'Apple',
    bgColor: FIXED.fixedBlack,
    logo: require('@/assets/icons/apple_logo.png'),
  },
  kakao: {
    label: '카카오톡',
    bgColor: FIXED.kakao,
    logo: require('@/assets/icons/kakao_logo.png'),
  },
  email: {
    label: '이메일',
    bgColor: FIXED.fixedWhite,
    logo: require('@/assets/icons/mail_logo.png'),
  },
};

interface RowItemProps {
  label: string;
  onPress: () => void;
}

function RowItem({ label, onPress }: RowItemProps) {
  return (
    <Pressable onPress={onPress} className="h-12 justify-center px-4">
      <Text className="text-body-md text-danger">{label}</Text>
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
  // 목록이 비었다는 것과 아직 못 받았다는 것은 다르다. 예전에는 둘 다
  // accounts.length === 0 으로 판단해서, 연동 계정이 없으면 스피너가 영영 돌았다.
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsFailed, setAccountsFailed] = useState(false);
  const colors = useColors();

  const loadAccounts = useCallback(() => {
    setAccountsLoading(true);
    setAccountsFailed(false);
    fetchLinkedAccounts()
      .then(setAccounts)
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setAccountsFailed(true);
      })
      .finally(() => setAccountsLoading(false));
  }, []);

  useEffect(loadAccounts, [loadAccounts]);

  // 읽기 전에는 null이라 셀렉터를 그리지 않는다. 기본값으로 먼저 그리면
  // 사용자가 고르지도 않은 값이 선택된 것처럼 보인다.
  const [visibility, setVisibility] = useState<AccountVisibility | null>(null);

  useEffect(() => {
    void fetchMyProfileSummary()
      .then((summary) => {
        if (summary) setVisibility(summary.accountVisibility);
      })
      .catch(Sentry.captureException);
  }, []);

  const handleVisibilityChange = (next: AccountVisibility) => {
    const previous = visibility;
    // 즉시 반영하고 실패하면 되돌린다. 저장 버튼이 없는 화면이라
    // 응답을 기다리면 탭이 먹통처럼 느껴진다.
    setVisibility(next);
    updateAccountVisibility(next).catch((e: unknown) => {
      Sentry.captureException(e);
      setVisibility(previous);
      setErrorMessage('공개 범위를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.');
      setShowErrorModal(true);
    });
  };

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
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title="계정 관리" />

      {/* 연동 계정 정보 */}
      <View className="px-4 pt-6 pb-4">
        <Text className="mb-4 text-caption-md text-gray-500">연동 계정 정보</Text>
        {accountsLoading ? (
          <Loading />
        ) : accountsFailed ? (
          <ErrorState message="연동 계정을 불러오지 못했어요" onRetry={loadAccounts} />
        ) : accounts.length === 0 ? (
          <Text className="text-body-md text-gray-500">연동된 계정이 없어요</Text>
        ) : (
          accounts.map((account) => {
            const cfg = PROVIDER_CONFIG[account.provider];
            return (
              <View key={account.provider} className="flex-row items-center gap-3 mb-3">
                <View
                  className="w-6 h-6 rounded-md items-center justify-center border border-gray-200  "
                  style={{ backgroundColor: cfg?.bgColor ?? colors.gray[200] }}
                >
                  {cfg?.logo && (
                    <Image
                      source={cfg.logo}
                      style={{ width: 14, height: 14 }}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <Text className="text-body-md text-gray-900">{cfg?.label ?? account.provider}</Text>
                {/* 가짜 주소가 새어 나가는 걸 막는 마지막 방어선.
                    카카오는 진짜 이메일(없으면 닉네임)이 여기로 온다. */}
                <Text className="ml-auto shrink text-body-md text-gray-500" numberOfLines={1}>
                  {account.email?.endsWith('@kakao.bingket') ? '' : (account.email ?? '')}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View className="h-px bg-gray-300" />

      {/* 계정 공개 범위 — 프로필 편집에 있던 것을 옮겨 왔다.
          저장 버튼이 따로 없는 화면이라 고르는 즉시 저장한다. */}
      <View className="px-4 py-6">
        <Text className="mb-4 text-caption-md text-gray-500">계정 공개 범위</Text>
        {visibility && (
          <AccountVisibilitySelector value={visibility} onChange={handleVisibilityChange} />
        )}
      </View>

      <View className="h-px bg-gray-300" />

      {loading ? (
        <View className="py-6 items-center">
          <Loading />
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
        cancelLabel="취소"
        confirmLabel="초기화 하기"
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
        body={`• 계정과 프로필 정보, 프로필 사진이 삭제돼요.\n• 계정 삭제 후 데이터 복구가 불가능해요.\n• 작성한 글과 댓글은 첨부한 사진과 함께 (알 수 없음)으로 남아요`}
        variant="warning"
        cancelLabel="취소"
        confirmLabel="탈퇴하기"
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
