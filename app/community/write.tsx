import { useRef, useState } from 'react';
import {
  Alert,
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
import { Text } from '@/components/Text';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import CameraIcon from '@/assets/icons/ic_camera.svg';
import CheckIcon from '@/assets/icons/ic_check.svg';
import CloseIcon from '@/assets/icons/ic_close.svg';
import type { PostCategory, EditorBlock } from '@/types/community';
import type { BingoData, BingoState } from '@/types/bingo';
import { fetchMyBingosForPost, createPost, updatePost } from '@/features/community/lib/community';
import { checkAndAwardBadges } from '@/lib/badge-checker';
import BingoPreview from '@/components/BingoPreview';
import { Toast } from '@/components/Toast';
import { containsBadWord } from '@/constants/bad-words';
import Loading from '@/components/Loading';

const HEADER_H = 60;
const TITLE_H = 60;
const TOOLBAR_H = 44;
const MAX_IMAGES = 5;

const TYPE_OPTIONS: Array<{ value: PostCategory; label: string }> = [
  { value: 'bingo_board', label: '빙고판' },
  { value: 'bingo_achieve', label: '빙고 달성' },
  { value: 'free', label: '자유게시판' },
];

const STATE_LABELS: Record<BingoState, string> = {
  draft: '제작 중',
  progress: '진행 중',
  done: '완료',
};

const STATE_COLORS: Record<BingoState, string> = {
  draft: '#929898' /* gray-500 */,
  progress: '#48BE30' /* green-600 */,
  done: '#28C8DE' /* sky-500 */,
};

function GridIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 2.5 }}>
      {[...Array(9)].map((_, i) => (
        <View
          key={i}
          style={{ width: 5.5, height: 5.5, backgroundColor: color, borderRadius: 1 }}
        />
      ))}
    </View>
  );
}

function newId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** 수정 모드 진입 시 DB content(JSON)에서 초기 상태 복원 */
function parseInitialState(
  initContent?: string,
  initImageUrls?: string,
): { mediaBlocks: EditorBlock[]; textValue: string } {
  const mediaBlocks: EditorBlock[] = [];
  let textValue = '';

  if (!initContent) return { mediaBlocks, textValue };

  try {
    const parsed = JSON.parse(initContent);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].type === 'string') {
      const existingUrls: string[] = initImageUrls ? (JSON.parse(initImageUrls) as string[]) : [];
      for (const b of parsed) {
        if (b.type === 'text') textValue += (textValue ? '\n' : '') + b.value;
        else if (b.type === 'image') {
          const url = existingUrls[b.index];
          if (url) mediaBlocks.push({ id: newId(), type: 'existing-image', url });
        }
        // bingo 블록은 수정 모드에서 재첨부 불필요 (bingo_board_id 기반이므로 로컬에 없음)
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
    initCategory?: string;
    initImageUrls?: string;
    initIsAnonymous?: string;
  }>();
  const isEditMode = !!params.postId;

  const insets = useSafeAreaInsets();
  const iconColor = '#4C5252'; /* gray-700 */

  const [type, setType] = useState<PostCategory | null>(
    (params.initCategory as PostCategory | undefined) ?? null,
  );
  const [title, setTitle] = useState(params.initTitle ?? '');
  const [isAnonymous, setIsAnonymous] = useState(params.initIsAnonymous !== '0');

  const initState = parseInitialState(params.initContent, params.initImageUrls);
  const [mediaBlocks, setMediaBlocks] = useState<EditorBlock[]>(initState.mediaBlocks);
  const [textValue, setTextValue] = useState(initState.textValue);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showBingoModal, setShowBingoModal] = useState(false);

  const [myBingos, setMyBingos] = useState<BingoData[]>([]);
  const [loadingBingos, setLoadingBingos] = useState(false);
  const bingosLoadedRef = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const imageBlocks = mediaBlocks.filter((b) => b.type === 'image' || b.type === 'existing-image');
  const bingoBlock = mediaBlocks.find((b) => b.type === 'bingo') as
    | (EditorBlock & { type: 'bingo' })
    | undefined;
  const imageBlockCount = imageBlocks.length;

  const canSubmit =
    type !== null && title.trim().length > 0 && textValue.trim().length > 0 && !isSubmitting;

  // ── 빙고 ─────────────────────────────────────────────────
  const handleOpenBingoModal = async () => {
    setShowBingoModal(true);
    if (bingosLoadedRef.current) return;
    setLoadingBingos(true);
    try {
      const bingos = await fetchMyBingosForPost();
      setMyBingos(bingos);
      bingosLoadedRef.current = true;
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
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
        await updatePost({ postId: params.postId!, category: type!, title, isAnonymous, blocks });
      } else {
        await createPost({ category: type!, title, isAnonymous, blocks });
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
    <SafeAreaView className="flex-1 bg-white  " edges={['top']}>
      {/* 헤더 */}
      <View
        className="flex-row items-center border-b border-gray-300  "
        style={{ height: HEADER_H }}
      >
        <View style={{ width: 56 }} className="pl-4">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowBackIcon width={20} height={20} color={iconColor} />
          </Pressable>
        </View>
        <Text className="flex-1 text-title-sm text-center">
          {isEditMode ? '게시글 수정하기' : '게시글 작성하기'}
        </Text>
        <View style={{ width: 56 }} className="pr-4 items-end">
          <Pressable onPress={handleSubmit} disabled={!canSubmit} hitSlop={8}>
            {isSubmitting ? (
              <Loading color="#54DBED" variant="iconloading" size={5} />
            ) : (
              <Text className="text-title-sm" style={{ color: canSubmit ? '#28C8DE' : '#B4BBBB' }}>
                등록
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* 제목 */}
        <View className="border-b border-gray-300  " style={{ height: TITLE_H }}>
          <RNTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요."
            placeholderTextColor="#929898"
            style={{
              flex: 1,
              paddingHorizontal: 20,
              fontSize: 18,
              fontWeight: '500',
              lineHeight: 24,
              color: '#181C1C',
            }}
          />
        </View>

        {/* 툴바 */}
        <View
          className="flex-row items-center px-5 gap-4 border-b border-gray-300  "
          style={{ height: TOOLBAR_H }}
        >
          <Pressable
            onPress={() => setShowTypeDropdown((v) => !v)}
            className="flex-row items-center gap-1"
            hitSlop={8}
          >
            <Text style={{ color: '#EF4444', fontSize: 18, lineHeight: 20 }}>*</Text>
            <Text className="text-body-sm" style={{ color: '#181C1C' }}>
              {type ? TYPE_OPTIONS.find((o) => o.value === type)?.label : '게시판 선택'}
            </Text>
            <Text style={{ color: '#929898', fontSize: 9, lineHeight: 14 }}>▼</Text>
          </Pressable>

          <View style={{ flex: 1 }} />

          {/* 카메라 */}
          <Pressable
            onPress={() => {
              if (imageBlockCount < MAX_IMAGES) setShowCameraMenu(true);
            }}
            hitSlop={8}
          >
            <CameraIcon
              width={24}
              height={24}
              color={imageBlockCount >= MAX_IMAGES ? '#B4BBBB' : iconColor}
            />
            {imageBlockCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -6,
                  backgroundColor: '#28C8DE',
                  borderRadius: 8,
                  minWidth: 14,
                  height: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 9, lineHeight: 12 }}>
                  {imageBlockCount}
                </Text>
              </View>
            )}
          </Pressable>

          {/* 빙고 */}
          <Pressable onPress={handleOpenBingoModal} hitSlop={8}>
            <GridIcon color={bingoBlock ? '#28C8DE' : iconColor} />
          </Pressable>

          {/* 익명 */}
          <Pressable
            onPress={() => setIsAnonymous((v) => !v)}
            className="flex-row items-center gap-1"
            hitSlop={8}
          >
            <Text className="text-body-sm" style={{ color: isAnonymous ? '#28C8DE' : '#B4BBBB' }}>
              익명
            </Text>
            <CheckIcon width={18} height={18} color={isAnonymous ? '#28C8DE' : '#B4BBBB'} />
          </Pressable>
        </View>

        {/* 본문 */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* 빙고 (맨 위) */}
          {bingoBlock && (
            <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8 }}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Text
                    className="text-caption-sm"
                    style={{ color: STATE_COLORS[bingoBlock.bingo.state] }}
                  >
                    {STATE_LABELS[bingoBlock.bingo.state]}
                  </Text>
                  <Text className="text-label-sm" style={{ color: '#929898' }}>
                    {bingoBlock.bingo.title}
                  </Text>
                </View>
                <Pressable onPress={() => removeMedia(bingoBlock.id)} hitSlop={8}>
                  <Text style={{ color: '#929898', fontSize: 18, lineHeight: 20 }}>×</Text>
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
              <View key={block.id} style={{ marginHorizontal: 20, marginVertical: 8 }}>
                <AutoHeightImage uri={uri} />
                <Pressable
                  onPress={() => removeMedia(block.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    borderRadius: 16,
                    padding: 6,
                  }}
                >
                  <CloseIcon width={16} height={16} color="#fff" />
                </Pressable>
              </View>
            );
          })}

          {/* 본문 텍스트 (항상 하단) */}
          <RNTextInput
            value={textValue}
            onChangeText={setTextValue}
            placeholder="부적절하거나 불쾌감을 줄 수 있는 컨텐츠를 게시할 경우 제재를 받을 수 있어요."
            placeholderTextColor="#929898"
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 160,
              paddingHorizontal: 20,
              paddingTop: 16,
              fontSize: 16,
              lineHeight: 22,
              color: '#181C1C',
            }}
          />
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 게시판 선택 드롭다운 */}
      {showTypeDropdown && (
        <>
          <Pressable
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10 }}
            onPress={() => setShowTypeDropdown(false)}
          />
          <View
            className="absolute bg-white   rounded-xl border border-gray-200  "
            style={{
              top: HEADER_H + TITLE_H + TOOLBAR_H,
              left: 20,
              zIndex: 20,
              minWidth: 130,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {TYPE_OPTIONS.map((option, i) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  setType(option.value);
                  setShowTypeDropdown(false);
                }}
                className={`px-4 py-3${i < TYPE_OPTIONS.length - 1 ? ' border-b border-gray-100  ' : ''}`}
              >
                <Text
                  className="text-body-sm"
                  style={{
                    color: type === option.value ? '#28C8DE' : '#181C1C',
                    fontWeight: type === option.value ? '600' : '400',
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* 카메라 메뉴 */}
      <Modal
        visible={showCameraMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCameraMenu(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(115,115,115,0.5)' }}
          onPress={() => setShowCameraMenu(false)}
        />
        <View className="bg-white   rounded-t-3xl" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="items-center pt-3 pb-4">
            <View className="w-10 h-1 rounded-full bg-gray-300  " />
          </View>
          <Pressable onPress={handleCameraCapture} className="px-6 py-4 border-b border-gray-100  ">
            <Text className="text-body-lg">카메라로 촬영하기</Text>
          </Pressable>
          <Pressable onPress={handleGalleryPick} className="px-6 py-4">
            <Text className="text-body-lg">앨범에서 선택하기</Text>
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
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(115,115,115,0.5)' }}
          onPress={() => setShowBingoModal(false)}
        />
        <View
          className="bg-white   rounded-t-3xl"
          style={{ maxHeight: '60%', paddingBottom: insets.bottom + 16 }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-300  " />
          </View>
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="text-title-sm">내 빙고 선택</Text>
            <Pressable onPress={() => setShowBingoModal(false)} hitSlop={8}>
              <Text style={{ color: '#929898', fontSize: 20, lineHeight: 24 }}>×</Text>
            </Pressable>
          </View>

          {loadingBingos ? (
            <View className="flex-1 items-center justify-center py-8">
              <Loading color="#6ADE50" />
            </View>
          ) : myBingos.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-body-sm" style={{ color: '#929898' }}>
                빙고가 없습니다.
              </Text>
            </View>
          ) : (
            <ScrollView>
              {myBingos.map((bingo) => {
                const selected = bingoBlock?.bingo.id === bingo.id;
                return (
                  <Pressable
                    key={bingo.id}
                    onPress={() => handleSelectBingo(bingo)}
                    className={`px-5 py-4 border-b border-gray-100   flex-row items-center justify-between${selected ? ' bg-green-50  ' : ''}`}
                  >
                    <View>
                      <Text className="text-label-sm">{bingo.title}</Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <Text
                          className="text-caption-sm"
                          style={{ color: STATE_COLORS[bingo.state] }}
                        >
                          {STATE_LABELS[bingo.state]}
                        </Text>
                        <Text className="text-body-sm" style={{ color: '#929898' }}>
                          {bingo.grid}
                          {bingo.state !== 'draft' ? ` · ${bingo.achievedCount}칸 달성` : ''}
                        </Text>
                      </View>
                    </View>
                    {selected && <Text style={{ color: '#48BE30', fontSize: 18 }}>✓</Text>}
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
