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

// 시안: 하단 툴바 높이 84
const TOOLBAR_H = 84;
const MAX_IMAGES = 5;

const STATE_LABELS: Record<BingoState, string> = {
  draft: '제작 중',
  progress: '진행 중',
  done: '완료',
};

const STATE_CLASSES: Record<BingoState, string> = {
  draft: 'text-gray-500',
  progress: 'text-green-500',
  done: 'text-green-400',
};

function newId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** 수정 모드 진입 시 DB content(JSON)에서 초기 상태 복원 */
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
   * 키보드가 올라오면 하단 툴바를 감춘다. 글을 쓰는 동안에는 본문에 집중하고,
   * 이미지·빙고를 붙일 때만 키보드를 내려 툴바를 쓰는 흐름이다.
   *
   * 안드로이드는 adjustResize로 창 자체가 줄어 툴바가 키보드 위로 밀려 올라오므로,
   * 위치를 조정하는 대신 아예 렌더에서 빼야 양쪽 플랫폼이 같게 동작한다.
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

  // ── 빙고 ─────────────────────────────────────────────────
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
      // catch가 없으면 조회 실패가 "빙고가 없습니다"로 보인다.
      Sentry.captureException(e);
      setBingosFailed(true);
    } finally {
      setLoadingBingos(false);
    }
  };

  const handleSelectBingo = (bingo: BingoData) => {
    setMediaBlocks((prev) => {
      // 이미 빙고가 있으면 교체
      if (prev.some((b) => b.type === 'bingo')) {
        return prev.map((b) => (b.type === 'bingo' ? { id: b.id, type: 'bingo', bingo } : b));
      }
      // 빙고는 맨 앞에 추가
      return [{ id: newId(), type: 'bingo', bingo }, ...prev];
    });
    setShowBingoModal(false);
  };

  const removeMedia = (id: string) => setMediaBlocks((prev) => prev.filter((b) => b.id !== id));

  // ── 카메라 / 갤러리 ───────────────────────────────────────
  const handleCameraCapture = async () => {
    setShowCameraMenu(false);
    if (imageBlockCount >= MAX_IMAGES) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('카메라 권한 필요', '설정에서 카메라 접근을 허용해주세요.');
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
      Alert.alert('앨범 권한 필요', '설정에서 사진 접근을 허용해주세요.');
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

  // ── 제출 ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (containsBadWord(title) || containsBadWord(textValue)) {
      setToastVisible(true);
      return;
    }
    setIsSubmitting(true);
    // blocks = [빙고?, ...이미지들, text]
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
        '오류',
        err instanceof Error
          ? err.message
          : isEditMode
            ? '게시글 수정에 실패했습니다.'
            : '게시글 작성에 실패했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* 헤더 — 뒤로가기 / 등록 */}
      <View className="flex-row items-center" style={{ height: HEADER_HEIGHT }}>
        <View style={{ width: 56 }} className="pl-4">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowBackIcon width={24} height={24} className="text-gray-900" />
          </Pressable>
        </View>
        <View style={{ flex: 1 }} />
        <View className="pr-2">
          <Button
            label="등록"
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
        {/* 본문 */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* 화면 제목 */}
          <Text className="mb-4 px-4 text-title-sm font-pretendard-semibold text-gray-900">
            {isEditMode ? '게시글 수정하기' : '게시글 작성하기'}
          </Text>

          {/* 제목 */}
          <View className="mb-4 px-6">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력해주세요."
              maxLength={LIMITS.postTitle}
            />
          </View>

          {/* 빙고 (맨 위) */}
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

          {/* 이미지들 */}
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

          {/* 본문 텍스트 (항상 하단) */}
          <RNTextInput
            value={textValue}
            onChangeText={setTextValue}
            placeholder="내용을 입력해주세요."
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

        {/* 하단 툴바 — 키보드가 올라오면 감춘다 */}
        {!keyboardShown && (
          <View
            className="flex-row items-center gap-2 border-t border-gray-300 px-4"
            style={{ height: TOOLBAR_H, marginBottom: insets.bottom }}
          >
            {/* 이미지 */}
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

            {/* 빙고 불러오기 — 누르는 동안, 그리고 빙고를 붙인 뒤에는 알약 배경 */}
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
                    빙고 불러오기
                  </Text>
                </View>
              )}
            </Pressable>

            {/* 익명 */}
            <Pressable
              onPress={() => setIsAnonymous((v) => !v)}
              className="flex-row items-center gap-1"
              hitSlop={8}
            >
              <Text className={`text-body-md ${isAnonymous ? 'text-green-400' : 'text-gray-400'}`}>
                익명
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

      {/* 카메라 메뉴 */}
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
            <Text className="text-body-md">카메라로 촬영하기</Text>
          </Pressable>
          <Pressable onPress={handleGalleryPick} className="px-6 py-4">
            <Text className="text-body-md">앨범에서 선택하기</Text>
          </Pressable>
        </View>
      </Modal>

      <Toast
        message="올바르지 않은 표현을 사용했어요"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />

      {/* 빙고 선택 모달 */}
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
            <Text className="text-title-sm font-pretendard-medium">빙고 불러오기</Text>
          </View>

          {loadingBingos ? (
            <View className="items-center justify-center py-10">
              <Loading />
            </View>
          ) : bingosFailed ? (
            <ErrorState
              message="빙고 목록을 불러오지 못했어요"
              onRetry={() => {
                bingosLoadedRef.current = false;
                void handleOpenBingoModal();
              }}
            />
          ) : myBingos.length === 0 ? (
            <EmptyState message="빙고가 없습니다." />
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
