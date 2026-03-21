import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput as RNTextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import CameraIcon from '@/assets/icons/ic_camera.svg';
import { CommunityPost } from '@/types/community';
import { BingoData } from '@/types/bingo';
import { MOCK_BINGOS } from '@/mocks/bingo';

const HEADER_H = 60;
const TITLE_H = 60;
const TOOLBAR_H = 44;

const TYPE_OPTIONS: Array<{ value: CommunityPost['type']; label: string }> = [
  { value: 'bingo', label: '빙고판' },
  { value: 'achievement', label: '빙고 달성' },
  { value: 'free', label: '자유게시판' },
];

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

function BingoPreview({ bingo }: { bingo: BingoData }) {
  const [cols] = bingo.grid.split('x').map(Number);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {bingo.cells.map((text, i) => (
        <View
          key={i}
          style={{
            width: `${(100 - (cols - 1) * 2) / cols}%` as unknown as number,
            aspectRatio: 1,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#D2D6D6' /* gray-300 */,
            backgroundColor: '#FDFDFD' /* white */,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          <Text
            className="text-caption-sm text-center"
            style={{ color: '#181C1C' /* gray-900 */ }}
            numberOfLines={2}
          >
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function CommunityWriteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */

  const [type, setType] = useState<CommunityPost['type'] | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachedBingo, setAttachedBingo] = useState<BingoData | null>(null);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showBingoModal, setShowBingoModal] = useState(false);

  const canSubmit = type !== null && title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // TODO: API 호출
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      {/* 헤더 */}
      <View
        className="flex-row items-center border-b border-gray-300 dark:border-gray-700"
        style={{ height: HEADER_H }}
      >
        <View style={{ width: 56 }} className="pl-4">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowBackIcon width={20} height={20} color={iconColor} />
          </Pressable>
        </View>
        <Text className="flex-1 text-title-sm text-center">게시글 작성하기</Text>
        <View style={{ width: 56 }} className="pr-4 items-end">
          <Pressable onPress={handleSubmit} disabled={!canSubmit} hitSlop={8}>
            <Text
              className="text-label-sm"
              style={{ color: canSubmit ? '#28C8DE' /* sky-500 */ : '#B4BBBB' /* gray-400 */ }}
            >
              등록
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* 제목 */}
        <View className="border-b border-gray-300 dark:border-gray-700" style={{ height: TITLE_H }}>
          <RNTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요."
            placeholderTextColor="#929898" /* gray-500 */
            style={{
              flex: 1,
              paddingHorizontal: 20,
              fontSize: 18,
              fontWeight: '500',
              lineHeight: 24,
              color: isDark ? '#F6F7F7' : '#181C1C' /* gray-100 : gray-900 */,
            }}
          />
        </View>

        {/* 툴바 */}
        <View
          className="flex-row items-center px-5 gap-4 border-b border-gray-300 dark:border-gray-700"
          style={{ height: TOOLBAR_H }}
        >
          {/* 게시판 선택 드롭다운 */}
          <Pressable
            onPress={() => setShowTypeDropdown((v) => !v)}
            className="flex-row items-center gap-1"
            hitSlop={8}
          >
            <Text style={{ color: '#EF4444' /* red-500 */, fontSize: 18, lineHeight: 20 }}>*</Text>
            <Text className="text-body-sm" style={{ color: '#181C1C' /* gray-900 */ }}>
              {type ? TYPE_OPTIONS.find((o) => o.value === type)?.label : '게시판 선택'}
            </Text>
            <Text style={{ color: '#929898', fontSize: 9, lineHeight: 14 }}>▼</Text>
          </Pressable>

          <View style={{ flex: 1 }} />

          {/* 카메라 */}
          <Pressable onPress={() => setShowCameraMenu(true)} hitSlop={8}>
            <CameraIcon width={24} height={24} color={iconColor} />
          </Pressable>

          {/* 빙고 첨부 */}
          <Pressable onPress={() => setShowBingoModal(true)} hitSlop={8}>
            <GridIcon color={iconColor} />
          </Pressable>
        </View>

        {/* 본문 */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {attachedBingo && (
            <View className="px-5 pt-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-label-sm" style={{ color: '#929898' /* gray-500 */ }}>
                  {attachedBingo.title}
                </Text>
                <Pressable onPress={() => setAttachedBingo(null)} hitSlop={8}>
                  <Text style={{ color: '#929898', fontSize: 18, lineHeight: 20 }}>×</Text>
                </Pressable>
              </View>
              <BingoPreview bingo={attachedBingo} />
            </View>
          )}
          <RNTextInput
            value={content}
            onChangeText={setContent}
            placeholder="내용을 입력해주세요."
            placeholderTextColor="#929898" /* gray-500 */
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 200,
              paddingHorizontal: 20,
              paddingTop: 16,
              fontSize: 16,
              lineHeight: 22,
              color: isDark ? '#F6F7F7' : '#181C1C' /* gray-100 : gray-900 */,
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 게시판 선택 드롭다운 메뉴 */}
      {showTypeDropdown && (
        <>
          <Pressable
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10 }}
            onPress={() => setShowTypeDropdown(false)}
          />
          <View
            className="absolute bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
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
                className={`px-4 py-3${i < TYPE_OPTIONS.length - 1 ? ' border-b border-gray-100 dark:border-gray-700' : ''}`}
              >
                <Text
                  className="text-body-sm"
                  style={{
                    color:
                      type === option.value
                        ? '#28C8DE' /* sky-500 */
                        : isDark
                          ? '#F6F7F7'
                          : '#181C1C',
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

      {/* 카메라 메뉴 바텀시트 */}
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
        <View
          className="bg-white dark:bg-gray-900 rounded-t-3xl"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="items-center pt-3 pb-4">
            <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
          </View>
          {[{ label: '카메라로 촬영하기' }, { label: '앨범에서 선택하기' }].map((item, i) => (
            <Pressable
              key={i}
              onPress={() => setShowCameraMenu(false)}
              className={`px-6 py-4${i === 0 ? ' border-b border-gray-100 dark:border-gray-800' : ''}`}
            >
              <Text className="text-body-lg">{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>

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
          className="bg-white dark:bg-gray-900 rounded-t-3xl"
          style={{ maxHeight: '60%', paddingBottom: insets.bottom + 16 }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
          </View>
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="text-title-sm">내 빙고 선택</Text>
            <Pressable onPress={() => setShowBingoModal(false)} hitSlop={8}>
              <Text style={{ color: '#929898', fontSize: 20, lineHeight: 24 }}>×</Text>
            </Pressable>
          </View>
          <ScrollView>
            {MOCK_BINGOS.filter((b) => b.state === 'progress').map((bingo) => (
              <Pressable
                key={bingo.id}
                onPress={() => {
                  setAttachedBingo(bingo);
                  setShowBingoModal(false);
                }}
                className={`px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-row items-center justify-between${attachedBingo?.id === bingo.id ? ' bg-green-50 dark:bg-gray-800' : ''}`}
              >
                <View>
                  <Text className="text-label-sm">{bingo.title}</Text>
                  <Text
                    className="text-body-sm"
                    style={{ color: '#929898' /* gray-500 */, marginTop: 2 }}
                  >
                    {bingo.grid} · {bingo.achievedCount}칸 달성
                  </Text>
                </View>
                {attachedBingo?.id === bingo.id && (
                  <Text style={{ color: '#48BE30' /* green-600 */, fontSize: 18 }}>✓</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
