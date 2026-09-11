import { useEffect, useRef, useState } from 'react';
import { HEADER_HEIGHT } from '@/lib/layout';
import Button from '@/components/Button';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { AutoHeightImage } from '@/components/AutoHeightImage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sentry from '@sentry/react-native';
import { Text } from '@/components/Text';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import ImagesIcon from '@/assets/icons/ic_imagesmode.svg';
import GridIcon from '@/assets/icons/ic_grid_3x3.svg';
import CheckIcon from '@/assets/icons/ic_check.svg';
import CloseIcon from '@/assets/icons/ic_close.svg';
import type { EditorBlock } from '@/types/community';
import { LIMITS } from '@/constants/limits';
import { TextInput } from '@/components/TextInput';
import type { BingoData, BingoState, BingoTheme } from '@/types/bingo';
import { fetchMyBingosForPost, createPost, updatePost } from '@/features/community/lib/community';
import { checkAndAwardBadges } from '@/lib/badge-checker';
import BingoPreview from '@/components/BingoPreview';
import { Toast } from '@/components/Toast';
import { containsBadWord } from '@/constants/bad-words';
import { ensurePhotoLibraryPermission } from '@/lib/photo-library';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';

// Design spec: bottom toolbar height is 84
const TOOLBAR_H = 84;
const MAX_IMAGES = 5;

function newId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Restore the initial state from the DB content (JSON) when entering edit mode */
function parseInitialState(
  initContent?: string,
  initImageUrls?: string,
  initBingo?: string,
): { mediaBlocks: EditorBlock[]; textValue: string } {
  const mediaBlocks: EditorBlock[] = [];
  let textValue = '';

  if (!initContent) return { mediaBlocks, textValue };

  let bingoData: BingoData | null = null;
  if (initBingo) {
    try {
      const b = JSON.parse(initBingo) as {
        id?: string;
        title?: string;
        cells: string[];
        grid: string;
        theme: BingoTheme;
      };
      bingoData = {
        id: b.id ?? 'draft',
        title: b.title ?? '',
        grid: b.grid,
        cells: b.cells,
        theme: b.theme,
        state: b.id ? 'progress' : 'draft',
        maxEdits: 0,
        achievedCount: 0,
        bingoCount: 0,
        dday: 0,
        startDate: null,
        targetDate: null,
        retrospective: null,
      };
    } catch {
      // ignore malformed bingo param
    }
  }

  try {
    const parsed = JSON.parse(initContent);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].type === 'string') {
      const existingUrls: string[] = initImageUrls ? (JSON.parse(initImageUrls) as string[]) : [];
      for (const b of parsed) {
        if (b.type === 'text') textValue += (textValue ? '\n' : '') + b.value;
        else if (b.type === 'image') {
          const url = existingUrls[b.index];
          if (url) mediaBlocks.push({ id: newId(), type: 'existing-image', url });
        } else if (b.type === 'bingo' && bingoData) {
          mediaBlocks.push({ id: newId(), type: 'bingo', bingo: bingoData });
        }
      }
    } else {
      textValue = initContent;
    }
  } catch {
    textValue = initContent;
  }

  return { mediaBlocks, textValue };
}

export default function CommunityWriteScreen() {
  const { t } = useTranslation();

  const STATE_LABELS: Record<BingoState, string> = {
    draft: t('common.stateDraft'),
    progress: t('common.stateProgress'),
    done: t('common.stateDone'),
  };

  const STATE_CLASSES: Record<BingoState, string> = {
    draft: 'text-gray-500',
    progress: 'text-green-500',
    done: 'text-green-400',
  };

  const router = useRouter();
  const params = useLocalSearchParams<{
    postId?: string;
    initTitle?: string;
    initContent?: string;
    initImageUrls?: string;
    initBingo?: string;
    initIsAnonymous?: string;
  }>();
  const isEditMode = !!params.postId;

  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(params.initTitle ?? '');
  const [isAnonymous, setIsAnonymous] = useState(params.initIsAnonymous !== '0');

  const initState = parseInitialState(params.initContent, params.initImageUrls, params.initBingo);
  const [mediaBlocks, setMediaBlocks] = useState<EditorBlock[]>(initState.mediaBlocks);
  const [textValue, setTextValue] = useState(initState.textValue);

  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showBingoModal, setShowBingoModal] = useState(false);

  const [myBingos, setMyBingos] = useState<BingoData[]>([]);
  const [loadingBingos, setLoadingBingos] = useState(false);
  const [bingosFailed, setBingosFailed] = useState(false);
  const bingosLoadedRef = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const imageBlocks = mediaBlocks.filter((b) => b.type === 'image' || b.type === 'existing-image');
  const bingoBlock = mediaBlocks.find((b) => b.type === 'bingo') as
    | (EditorBlock & { type: 'bingo' })
    | undefined;
  const imageBlockCount = imageBlocks.length;

  const canSubmit = title.trim().length > 0 && textValue.trim().length > 0 && !isSubmitting;

  /**
   * Hide the bottom toolbar when the keyboard comes up. While typing, focus stays
   * on the body text; the toolbar is only used after dismissing the keyboard to
   * attach an image or bingo.
   *
   * On Android, adjustResize shrinks the window itself, which pushes the toolbar
   * up above the keyboard. So instead of repositioning it, we remove it from the
   * render entirely to make both platforms behave the same way.
   */
  const [keyboardShown, setKeyboardShown] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardShown(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ── Bingo ─────────────────────────────────────────────────
  const handleOpenBingoModal = async () => {
    setShowBingoModal(true);
    if (bingosLoadedRef.current) return;
    setLoadingBingos(true);
    setBingosFailed(false);
    try {
      const bingos = await fetchMyBingosForPost();
      setMyBingos(bingos);
      bingosLoadedRef.current = true;
    } catch (e) {
      // Without this catch, a fetch failure would look like "no bingos".
      Sentry.captureException(e);
      setBingosFailed(true);
    } finally {
      setLoadingBingos(false);
    }
  };

  const handleSelectBingo = (bingo: BingoData) => {
    setMediaBlocks((prev) => {
      // Replace if a bingo block already exists
      if (prev.some((b) => b.type === 'bingo')) {
        return prev.map((b) => (b.type === 'bingo' ? { id: b.id, type: 'bingo', bingo } : b));
      }
      // Insert bingo at the front
      return [{ id: newId(), type: 'bingo', bingo }, ...prev];
    });
    setShowBingoModal(false);
  };

  const removeMedia = (id: string) => setMediaBlocks((prev) => prev.filter((b) => b.id !== id));

  // ── Camera / Gallery ───────────────────────────────────────
  const handleCameraCapture = async () => {
    setShowCameraMenu(false);
    if (imageBlockCount >= MAX_IMAGES) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permission.cameraTitle'), t('common.permission.cameraBody'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaBlocks((prev) => [
        ...prev,
        { id: newId(), type: 'image', uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
      ]);
    }
  };

  const handleGalleryPick = async () => {
    setShowCameraMenu(false);
    if (imageBlockCount >= MAX_IMAGES) return;
    if (!(await ensurePhotoLibraryPermission())) {
      Alert.alert(t('common.permission.albumnBody'), t('common.permission.albumnBody'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - imageBlockCount,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newBlocks: EditorBlock[] = result.assets.map((asset) => ({
        id: newId(),
        type: 'image' as const,
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
      }));
      setMediaBlocks((prev) => [...prev, ...newBlocks]);
    }
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (containsBadWord(title) || containsBadWord(textValue)) {
      setToastVisible(true);
      return;
    }
    setIsSubmitting(true);
    // blocks = [bingo?, ...images, text]
    const blocks: EditorBlock[] = [...mediaBlocks, { id: newId(), type: 'text', value: textValue }];
    try {
      if (isEditMode) {
        await updatePost({ postId: params.postId!, title, isAnonymous, blocks });
      } else {
        await createPost({ title, isAnonymous, blocks });
        checkAndAwardBadges('post');
      }
      router.back();
    } catch (err) {
      Alert.alert(
        t('common.error.general'),
        err instanceof Error
          ? err.message
          : isEditMode
            ? t('community.editPostFail')
            : t('community.createPostFail'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header — back / submit */}
      <View className="flex-row items-center" style={{ height: HEADER_HEIGHT }}>
        <View style={{ width: 56 }} className="pl-4">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowBackIcon width={24} height={24} className="text-gray-900" />
          </Pressable>
        </View>
        <View style={{ flex: 1 }} />
        <View className="pr-2">
          <Button
            label={t('community.submit')}
            size="sm"
            variant="ghost"
            disabled={!canSubmit}
            loading={isSubmitting}
            onClick={handleSubmit}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Body */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* Screen title */}
          <Text className="mb-4 px-4 text-title-sm font-pretendard-semibold text-gray-900">
            {isEditMode ? t('community.editPostTitle') : t('community.writePostTitle')}
          </Text>

          {/* Title */}
          <View className="mb-4 px-6">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('home.enterTitle')}
              maxLength={LIMITS.postTitle}
            />
          </View>

          {/* Bingo (top) */}
          {bingoBlock && (
            <View style={{ marginHorizontal: 24, marginTop: 16, marginBottom: 8 }}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="mr-2 flex-1 flex-row items-center gap-2">
                  <Text className={`text-caption-sm ${STATE_CLASSES[bingoBlock.bingo.state]}`}>
                    {STATE_LABELS[bingoBlock.bingo.state]}
                  </Text>
                  <Text className="shrink text-label-sm text-gray-500" numberOfLines={1}>
                    {bingoBlock.bingo.title}
                  </Text>
                </View>
                <Pressable onPress={() => removeMedia(bingoBlock.id)} hitSlop={8}>
                  <CloseIcon width={18} height={18} className="text-gray-500" />
                </Pressable>
              </View>
              <BingoPreview bingo={bingoBlock.bingo} size="md" />
            </View>
          )}

          {/* Images */}
          {imageBlocks.map((block) => {
            const uri =
              block.type === 'image'
                ? block.uri
                : (block as EditorBlock & { type: 'existing-image' }).url;
            return (
              <View key={block.id} style={{ marginHorizontal: 24, marginVertical: 8 }}>
                <AutoHeightImage uri={uri} />
                <Pressable
                  onPress={() => removeMedia(block.id)}
                  className="absolute right-2 top-2 rounded-2xl bg-overlay-media p-1.5"
                >
                  <CloseIcon width={18} height={18} className="text-fixed-white" />
                </Pressable>
              </View>
            );
          })}

          {/* Body text (always at the bottom) */}
          <RNTextInput
            value={textValue}
            onChangeText={setTextValue}
            placeholder={t('community.contentPlaceholder')}
            maxLength={LIMITS.postContent}
            multiline
            textAlignVertical="top"
            className="text-body-md text-gray-900 placeholder:text-gray-500"
            style={{
              minHeight: 200,
              paddingHorizontal: 24,
              paddingTop: 4,
              lineHeight: 22,
            }}
          />
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom toolbar — hidden when the keyboard is up */}
        {!keyboardShown && (
          <View
            className="flex-row items-center gap-2 border-t border-gray-300 px-4"
            style={{ height: TOOLBAR_H, marginBottom: insets.bottom }}
          >
            {/* Image */}
            <Pressable
              onPress={() => {
                if (imageBlockCount < MAX_IMAGES) setShowCameraMenu(true);
              }}
              hitSlop={8}
              className="p-1"
            >
              <ImagesIcon
                width={32}
                height={32}
                className={imageBlockCount >= MAX_IMAGES ? 'text-gray-400' : 'text-gray-700'}
              />
              {imageBlockCount > 0 && (
                <View
                  className="absolute -right-0.5 -top-0.5 items-center justify-center rounded-lg bg-green-400 px-0.5"
                  style={{ minWidth: 14, height: 14 }}
                >
                  <Text className="text-on-brand" style={{ fontSize: 9, lineHeight: 12 }}>
                    {imageBlockCount}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Load bingo — pill background while pressed, and after a bingo is attached */}
            <Pressable onPress={handleOpenBingoModal} hitSlop={8}>
              {({ pressed }) => (
                <View
                  className={`h-10 flex-row items-center gap-1 rounded-2xl px-2${
                    pressed || bingoBlock ? ' bg-gray-200' : ''
                  }`}
                >
                  <GridIcon
                    width={32}
                    height={32}
                    className={bingoBlock ? 'text-green-400' : 'text-gray-700'}
                  />
                  <Text className="text-body-md font-pretendard-medium text-gray-800">
                    {t('community.loadBingo')}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Anonymous */}
            <Pressable
              onPress={() => setIsAnonymous((v) => !v)}
              className="flex-row items-center gap-1"
              hitSlop={8}
            >
              <Text className={`text-body-md ${isAnonymous ? 'text-green-400' : 'text-gray-400'}`}>
                {t('community.anonymous')}
              </Text>
              <CheckIcon
                width={20}
                height={20}
                className={isAnonymous ? 'text-green-400' : 'text-gray-400'}
              />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Camera menu */}
      <Modal
        visible={showCameraMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCameraMenu(false)}
      >
        <Pressable className="flex-1 bg-scrim/70" onPress={() => setShowCameraMenu(false)} />
        <View className="bg-white   rounded-t-2xl" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="items-center pt-3 pb-4">
            <View className="w-10 h-1 rounded-full bg-gray-300  " />
          </View>
          <Pressable onPress={handleCameraCapture} className="px-6 py-4 border-b border-gray-100  ">
            <Text className="text-body-md">{t('community.takePhoto')}</Text>
          </Pressable>
          <Pressable onPress={handleGalleryPick} className="px-6 py-4">
            <Text className="text-body-md">{t('community.pickFromAlbum')}</Text>
          </Pressable>
        </View>
      </Modal>

      <Toast
        message={t('community.badWordToast')}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Bingo selection modal */}
      <Modal
        visible={showBingoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBingoModal(false)}
      >
        <Pressable className="flex-1 bg-scrim/70" onPress={() => setShowBingoModal(false)} />
        <View
          className="bg-white   rounded-t-2xl"
          style={{ maxHeight: '60%', paddingBottom: insets.bottom + 16 }}
        >
          <View className="border-b border-gray-300 px-5 pb-4 pt-6">
            <Text className="text-title-sm font-pretendard-medium">{t('community.loadBingo')}</Text>
          </View>

          {loadingBingos ? (
            <View className="items-center justify-center py-10">
              <Loading />
            </View>
          ) : bingosFailed ? (
            <ErrorState
              message={t('community.myBingosLoadFail')}
              onRetry={() => {
                bingosLoadedRef.current = false;
                void handleOpenBingoModal();
              }}
            />
          ) : myBingos.length === 0 ? (
            <EmptyState message={t('community.noBingos')} />
          ) : (
            <ScrollView>
              {myBingos.map((bingo) => {
                const selected = bingoBlock?.bingo.id === bingo.id;
                return (
                  <Pressable
                    key={bingo.id}
                    onPress={() => handleSelectBingo(bingo)}
                    className="h-16 flex-row items-center justify-between border-b border-gray-300 px-5"
                  >
                    <Text className="mr-2 flex-1 text-body-md text-gray-900" numberOfLines={1}>
                      {bingo.title}
                    </Text>
                    {selected && <CheckIcon width={20} height={20} className="text-green-400" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
