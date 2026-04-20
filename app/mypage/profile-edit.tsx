import IconButton from '@/components/IconButton';
import { Modal } from '@/components/Modal';
import { TextInput } from '@/components/TextInput';
import { Toast } from '@/components/Toast';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import CameraIcon from '@/assets/icons/ic_camera.svg';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Platform, Pressable, ScrollView, View } from 'react-native';
import { clearCache } from '@/lib/cache';

import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ProfileAvatar,
  randomDefaultAvatarUrl,
  DEFAULT_AVATAR_PREFIX,
} from '@/components/ProfileAvatar';
import { fetchMyProfile, updateMyProfile, uploadProfileImage } from '@/features/mypage/lib/mypage';
import Loading from '@/components/Loading';

const NAME_MAX = 20;
const USER_ID_MAX = 20;
const BIO_MAX = 50;

const NAME_INVALID = /[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318Fa-zA-Z0-9]/g;
const USER_ID_INVALID = /[^a-zA-Z0-9_-]/g;

export default function ProfileEditPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialValues = useRef({ name: '', userId: '', bio: '', avatarUri: null as string | null });

  useEffect(() => {
    fetchMyProfile().then((profile) => {
      if (!profile) return;
      setName(profile.displayName);
      setUserId(profile.username);
      setBio(profile.bio);
      setAvatarUri(profile.avatarUrl);
      initialValues.current = {
        name: profile.displayName,
        userId: profile.username,
        bio: profile.bio,
        avatarUri: profile.avatarUrl,
      };
    });
  }, []);

  const hasChanges = () =>
    name !== initialValues.current.name ||
    userId !== initialValues.current.userId ||
    bio !== initialValues.current.bio ||
    avatarUri !== initialValues.current.avatarUri;

  const handleBack = () => {
    if (hasChanges()) {
      setShowLeaveModal(true);
    } else {
      router.back();
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setToastVisible(true);
  };

  const handleNameChange = (v: string) => {
    const stripped = v.replace(NAME_INVALID, '');
    if (stripped.length < v.length) {
      showToast('한글/영어/숫자 조합으로만 입력할 수 있어요.');
    }
    setName(stripped.slice(0, NAME_MAX));
  };

  const handleUserIdChange = (v: string) => {
    const stripped = v.replace(USER_ID_INVALID, '');
    if (stripped.length < v.length) {
      showToast('영어/숫자/_ - 조합으로만 입력할 수 있어요.');
    }
    setUserId(stripped.slice(0, USER_ID_MAX));
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showToast(source === 'camera' ? '카메라 권한이 필요해요.' : '사진 접근 권한이 필요해요.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const applyDefaultAvatar = () => {
    setAvatarUri(randomDefaultAvatarUrl());
  };

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleCameraPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['취소', '카메라', '앨범에서 선택', '기본 이미지 적용'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) pickImage('camera');
          if (index === 2) pickImage('library');
          if (index === 3) applyDefaultAvatar();
        },
      );
    } else {
      setShowPhotoModal(true);
    }
  };

  const handleSave = async () => {
    if (name.trim().length === 0) {
      setErrorMessage('닉네임을 입력해주세요.');
      return;
    }
    if (userId.trim().length === 0) {
      setErrorMessage('아이디를 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      let newAvatarUrl: string | undefined;
      if (avatarUri && avatarUri.startsWith(DEFAULT_AVATAR_PREFIX)) {
        newAvatarUrl = avatarUri;
      } else if (avatarUri && !avatarUri.startsWith('http')) {
        const filename = avatarUri.split('/').pop() ?? 'profile.jpg';
        newAvatarUrl = await uploadProfileImage(avatarUri, filename);
      }
      await updateMyProfile({ displayName: name, username: userId, bio, avatarUrl: newAvatarUrl });
      await clearCache('@bingket/cache-my-profile');
      router.back();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setSaving(false);
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
          onClick={handleBack}
        />
        <Text className="flex-1 text-center text-title-sm font-pretendard-medium">프로필 편집</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving ? (
            <Loading color="#6ADE50" variant="iconloading" size={5} />
          ) : (
            <Text className="text-title-sm">저장</Text>
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* 프로필 이미지 */}
        <View className="items-center pt-8 pb-6">
          <View className="relative">
            <ProfileAvatar avatarUrl={avatarUri} />
            <View className="absolute -bottom-3 -right-3">
              <IconButton
                variant="secondary"
                size={36}
                icon={<CameraIcon width={18} height={18} />}
                onClick={handleCameraPress}
              />
            </View>
          </View>
        </View>

        {/* 폼 */}
        <View className="px-5 gap-5">
          <View className="gap-2">
            <Text className="text-title-sm">닉네임</Text>
            <TextInput
              value={name}
              onChangeText={handleNameChange}
              placeholder="한글/영어/숫자, 20자 이내"
            />
            <Text
              className="text-caption-md text-right"
              style={{ color: '#4C5252' /* gray-700 */ }}
            >
              {name.length}/{NAME_MAX}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-title-sm">아이디</Text>
            <TextInput
              value={userId}
              onChangeText={handleUserIdChange}
              placeholder="영어/숫자/_ - 조합, 20자 이내"
              autoCapitalize="none"
            />
            <Text
              className="text-caption-md text-right"
              style={{ color: '#4C5252' /* gray-700 */ }}
            >
              {userId.length}/{USER_ID_MAX}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-title-sm">한 줄 다짐</Text>
            <TextInput
              value={bio}
              onChangeText={(v) => setBio(v.slice(0, BIO_MAX))}
              placeholder="50자 이내로 입력해주세요."
              maxLength={BIO_MAX}
              maxHeight={64}
            />
            <Text
              className="text-caption-md text-right"
              style={{ color: '#4C5252' /* gray-700 */ }}
            >
              {bio.length}/{BIO_MAX}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Toast message={toast} visible={toastVisible} onDismiss={() => setToastVisible(false)} />
      <Modal
        visible={showLeaveModal}
        title="변경사항을 저장하지 않았어요"
        body="변경사항을 저장할까요?"
        variant="warning"
        cancelLabel="이어서 편집하기"
        confirmLabel="나가기"
        onCancel={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          router.back();
        }}
        onDismiss={() => setShowLeaveModal(false)}
      />
      <Modal
        visible={!!errorMessage}
        title="저장 실패"
        body={errorMessage ?? ''}
        variant="error"
        confirmLabel="확인"
        onConfirm={() => setErrorMessage(null)}
        onDismiss={() => setErrorMessage(null)}
      />
      <Modal
        visible={showPhotoModal}
        title="프로필 사진"
        variant="default"
        cancelLabel="취소"
        confirmLabel="카메라"
        onCancel={() => setShowPhotoModal(false)}
        onConfirm={() => {
          setShowPhotoModal(false);
          pickImage('camera');
        }}
        onDismiss={() => setShowPhotoModal(false)}
        body={
          <View className="gap-2">
            <Pressable
              onPress={() => {
                setShowPhotoModal(false);
                pickImage('library');
              }}
            >
              <Text className="text-body-md text-center py-2">앨범에서 선택</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowPhotoModal(false);
                applyDefaultAvatar();
              }}
            >
              <Text className="text-body-md text-center py-2">기본 이미지 적용</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}
