import { FocusedTextEditor } from '@/components/FocusedTextEditor';
import IconButton from '@/components/IconButton';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { TextInput } from '@/components/TextInput';
import { Toast } from '@/components/Toast';
import CameraIcon from '@/assets/icons/ic_camera.svg';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Platform, Pressable, ScrollView, View } from 'react-native';
import { clearCache } from '@/lib/cache';
import { ensurePhotoLibraryPermission } from '@/lib/photo-library';

import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ProfileAvatar,
  randomDefaultAvatarUrl,
  DEFAULT_AVATAR_PREFIX,
} from '@/components/ProfileAvatar';
import { fetchMyProfile, updateMyProfile, uploadProfileImage } from '@/features/mypage/lib/mypage';
import Button from '@/components/Button';
import { useTranslation } from 'react-i18next';

const NAME_MAX = 12;
const USER_ID_MAX = 20;
const BIO_MAX = 50;

const NAME_INVALID = /[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318Fa-zA-Z0-9]/g;
const USER_ID_INVALID = /[^a-zA-Z0-9_-]/g;

export default function ProfileEditPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialValues = useRef({
    name: '',
    userId: '',
    bio: '',
    avatarUri: null as string | null,
  });

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
      showToast(t('settings.profile.nickname.mixture'));
    }
    setName(stripped.slice(0, NAME_MAX));
  };

  const handleUserIdChange = (v: string) => {
    const stripped = v.replace(USER_ID_INVALID, '');
    if (stripped.length < v.length) {
      showToast(t('settings.profile.id.mixture'));
    }
    setUserId(stripped.slice(0, USER_ID_MAX));
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const granted =
      source === 'camera'
        ? (await ImagePicker.requestCameraPermissionsAsync()).granted
        : await ensurePhotoLibraryPermission();

    if (!granted) {
      showToast(
        source === 'camera'
          ? t('common.permission.cameraTitle')
          : t('common.permission.albumTitle'),
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
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
        {
          options: [
            t('common.cancel'),
            t('settings.profile.image.camera'),
            t('settings.profile.image.album'),
            t('settings.profile.image.default'),
          ],
          cancelButtonIndex: 0,
        },
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
      setErrorMessage(t('settings.profile.nickname.error'));
      return;
    }
    if (userId.trim().length === 0) {
      setErrorMessage(t('settings.profile.id.error'));
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
      setErrorMessage(e instanceof Error ? e.message : t('common.error.retry'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title={t('settings.profile.label')} onBack={handleBack} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="items-center pt-6 pb-6">
          <View className="relative">
            <ProfileAvatar avatarUrl={avatarUri} size={120} />
            <View className="absolute -right-1 bottom-0">
              <IconButton
                variant="secondary"
                size={40}
                icon={<CameraIcon width={24} height={24} className="text-gray-600" />}
                onClick={handleCameraPress}
              />
            </View>
          </View>
        </View>

        <View className="px-4 gap-5">
          <View className="gap-2">
            <Text className="text-body-md text-gray-900">
              {t('settings.profile.nickname.label')}
            </Text>
            <TextInput
              value={name}
              onChangeText={handleNameChange}
              placeholder={t('settings.profile.nickname.label', { count: NAME_MAX })}
            />
            <Text className="text-right text-caption-sm text-gray-500">
              {name.length}/{NAME_MAX}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-body-md text-gray-900">{t('settings.profile.id.label')}</Text>
            <TextInput
              value={userId}
              onChangeText={handleUserIdChange}
              placeholder={t('settings.profile.id.placeholder', { count: USER_ID_MAX })}
              autoCapitalize="none"
            />
            <Text className="text-right text-caption-sm text-gray-500">
              {userId.length}/{USER_ID_MAX}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-body-md text-gray-900">{t('settings.profile.bio.label')}</Text>
            <Pressable
              onPress={() => setEditingBio(true)}
              accessibilityLabel={t('settings.profile.bio.edit')}
            >
              <TextInput
                editable={false}
                pointerEvents="none"
                value={bio}
                onChangeText={(v) => setBio(v.slice(0, BIO_MAX))}
                placeholder={t('settings.profile.bio.placeholder', { count: BIO_MAX })}
                maxLength={BIO_MAX}
                maxHeight={64}
              />
            </Pressable>
            <Text className="text-right text-caption-sm text-gray-500">
              {bio.length}/{BIO_MAX}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 저장 */}
      <View className="px-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <Button
          label={t('common.save')}
          size="md"
          onClick={handleSave}
          disabled={saving}
          loading={saving}
          className="w-full"
        />
      </View>

      <FocusedTextEditor
        visible={editingBio}
        title={t('settings.profile.bio.label')}
        value={bio}
        onChangeText={setBio}
        onClose={() => setEditingBio(false)}
        maxLength={BIO_MAX}
        placeholder={t('settings.profile.bio.placeholder', { count: BIO_MAX })}
      />
      <Toast message={toast} visible={toastVisible} onDismiss={() => setToastVisible(false)} />
      <Modal
        visible={showLeaveModal}
        title={t('common.unsaved.title')}
        body={t('common.unsaved.body')}
        cancelLabel={t('common.unsaved.cancel')}
        confirmLabel={t('common.unsaved.confirm')}
        onCancel={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          router.back();
        }}
        onDismiss={() => setShowLeaveModal(false)}
      />
      <Modal
        visible={!!errorMessage}
        title={t('common.error.save')}
        body={errorMessage ?? ''}
        variant="error"
        confirmLabel={t('common.confirm')}
        onConfirm={() => setErrorMessage(null)}
        onDismiss={() => setErrorMessage(null)}
      />
      <Modal
        visible={showPhotoModal}
        title={t('settings.profile.image.label')}
        variant="default"
        cancelLabel={t('common.cancel')}
        confirmLabel={t('settings.profile.image.camera')}
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
              <Text className="text-body-md text-center py-2">
                {t('settings.profile.image.album')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowPhotoModal(false);
                applyDefaultAvatar();
              }}
            >
              <Text className="text-body-md text-center py-2">
                {t('settings.profile.image.default')}
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}
