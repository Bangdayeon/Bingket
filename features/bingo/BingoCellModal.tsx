import DateTimePicker from '@react-native-community/datetimepicker';
import CalendarIcon from '@/assets/icons/ic_calendar.svg';
import DoneIcon from '@/assets/icons/ic_done.svg';
import CheckIcon from '@/assets/icons/ic_check.svg';
import { BingoCellDetail } from '@/types/bingo-cell';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  TextInput as RNTextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { TABLET_MAX_CONTENT_WIDTH } from '@/lib/use-responsive';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from '@/components/IconButton';

const PEEK = 20;
const CARD_MARGIN = 4;
const CARD_HEIGHT = 460;

type CellUpdate = Partial<Pick<BingoCellDetail, 'completed' | 'completedAt' | 'memo'>>;

interface BingoCellModalProps {
  visible: boolean;
  cells: BingoCellDetail[];
  initialIndex: number;
  onClose: () => void;
  onUpdate: (cellId: string, updates: CellUpdate) => void;
  /** 완료된 빙고: 메모만 편집 가능, 완료 토글/완료일 숨김 */
  readOnly?: boolean;
}

/** 들여쓰기(탭·개행)를 공백으로 정규화하고 앞뒤 공백을 제거 */
function normalizeTitle(title: string): string {
  return title
    .replace(/\t/g, '  ') // 탭 → 공백 2칸
    .replace(/\n+/g, ' ') // 개행 → 공백
    .trim();
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function BingoCellModal({
  visible,
  cells,
  initialIndex,
  onClose,
  onUpdate,
  readOnly = false,
}: BingoCellModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = Math.min(width, TABLET_MAX_CONTENT_WIDTH) - PEEK * 2;
  const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
  const flatListRef = useRef<FlatList<BingoCellDetail>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [datePickerCellId, setDatePickerCellId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(initialIndex);
    const t = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [visible, initialIndex]);

  const handleToggleComplete = (cell: BingoCellDetail) => {
    if (!cell.completed) {
      onUpdate(cell.id, {
        completed: true,
        completedAt: cell.completedAt ?? new Date().toISOString(),
      });
    } else {
      onUpdate(cell.id, { completed: false, completedAt: null });
    }
  };

  const handleOpenDatePicker = (cell: BingoCellDetail) => {
    setTempDate(cell.completedAt ? new Date(cell.completedAt) : new Date());
    setDatePickerCellId(cell.id);
  };

  const handleDateConfirm = () => {
    if (!datePickerCellId) return;
    onUpdate(datePickerCellId, { completed: true, completedAt: tempDate.toISOString() });
    setDatePickerCellId(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(115,115,115,0.7)' /* gray-600/70 */,
        }}
        onPress={onClose}
      />

      {/* Centered content */}
      <View style={{ flex: 1, justifyContent: 'center' }} pointerEvents="box-none">
        <FlatList
          ref={flatListRef}
          data={cells}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: PEEK - CARD_MARGIN }}
          getItemLayout={(_, index) => ({
            length: SNAP_INTERVAL,
            offset: SNAP_INTERVAL * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL));
          }}
          style={{ flexGrow: 0 }}
          renderItem={({ item }) => (
            <View
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginHorizontal: CARD_MARGIN,
                backgroundColor: '#FDFDFD' /* white */,
                borderRadius: 30,
                padding: 24,
                overflow: 'hidden',
              }}
            >
              {/* Title + check button */}
              <View className="flex-row items-start mb-5 ">
                <Text
                  className="flex-1 text-title-lg mr-3 py-2.5 font-pretendard-semibold"
                  style={{ color: '#181C1C' /* gray-900 */ }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {normalizeTitle(item.title)}
                </Text>
                {!readOnly && (
                  <IconButton
                    variant="ghost"
                    onClick={() => handleToggleComplete(item)}
                    icon={
                      item.completed ? (
                        <DoneIcon width={24} height={24} color="#48BE30" /* green-600 */ />
                      ) : (
                        <CheckIcon width={24} height={24} color="#4C5252" /* gray-700 */ />
                      )
                    }
                  />
                )}
              </View>

              {/* 완료일 */}
              {(!readOnly || item.completedAt) && (
                <>
                  <Text
                    className="text-title-sm mb-2 font-pretendard-medium"
                    style={{ color: '#181C1C' /* gray-900 */ }}
                  >
                    완료일
                  </Text>
                  {readOnly ? (
                    <View className="flex-row items-center gap-1 bg-gray-100 rounded-full h-10 px-4 mb-5 self-start">
                      <CalendarIcon width={16} height={16} color="#4C5252" /* gray-700 */ />
                      <Text className="text-body-sm" style={{ color: '#181C1C' /* gray-900 */ }}>
                        {formatDate(item.completedAt)}
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleOpenDatePicker(item)}
                      className="flex-row items-center gap-1 bg-gray-100 rounded-full h-10 px-4 mb-5 self-start"
                    >
                      <CalendarIcon width={16} height={16} color="#4C5252" /* gray-700 */ />
                      <Text
                        className="text-body-sm"
                        style={{
                          color: item.completedAt ? '#181C1C' : '#929898' /* gray-900 : gray-500 */,
                        }}
                      >
                        {formatDate(item.completedAt) || '날짜 선택'}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}

              {/* 메모 */}
              <Text
                className="text-title-sm mb-2 font-pretendard-medium"
                style={{ color: '#181C1C' /* gray-900 */ }}
              >
                메모
              </Text>
              <View style={{ position: 'relative' }}>
                <RNTextInput
                  value={item.memo}
                  onChangeText={(v) => onUpdate(item.id, { memo: v })}
                  placeholder="메모를 입력해주세요."
                  placeholderTextColor="#B4BBBB" /* gray-400 */
                  multiline
                  scrollEnabled
                  textAlignVertical="top"
                  maxLength={500}
                  className="h-[190px] bg-gray-100 rounded-2xl p-4 text-body-md"
                  style={{ paddingBottom: 28 }}
                />
                <Text
                  className="text-caption-sm"
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 14,
                    color:
                      (item.memo?.length ?? 0) >= 500
                        ? '#4C5252' /* gray-700 */
                        : '#929898' /* gray-500 */,
                  }}
                >
                  {item.memo?.length ?? 0}/500
                </Text>
              </View>
            </View>
          )}
        />

        {/* Page indicator */}
        <View className="items-center mt-4" pointerEvents="none">
          <Text className="text-body-sm text-white">
            {currentIndex + 1} / {cells.length}
          </Text>
        </View>
      </View>

      {/* Date picker sheet */}
      {datePickerCellId && (
        <>
          <Pressable className="absolute z-10" onPress={() => setDatePickerCellId(null)} />
          <View
            className={`
            absolute bottom-0 left-0 right-0
            bg-white
            rounded-t-[16px]
            px-5 pt-4
            pb-[${insets.bottom + 16}px]
            z-11
          `}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-title-sm">완료일 선택</Text>
              <Pressable onPress={handleDateConfirm}>
                <Text className="text-title-sm" style={{ color: '#6ADE50' /* green-500 */ }}>
                  확인
                </Text>
              </Pressable>
            </View>
            <View style={{ height: 216 }}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (date) setTempDate(date);
                }}
                locale="ko-KR"
                textColor="#181C1C" /* gray-100 : gray-900 */
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </>
      )}
    </Modal>
  );
}
