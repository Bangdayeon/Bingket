import DateTimePicker from '@react-native-community/datetimepicker';
import CalendarIcon from '@/assets/icons/ic_calendar.svg';
import DoneIcon from '@/assets/icons/ic_done.svg';
import CheckIcon from '@/assets/icons/ic_check.svg';
import { BingoCellDetail } from '@/types/bingo-cell';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  TextInput as RNTextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/IconButton';

const SCREEN_W = Dimensions.get('window').width;
const PEEK = 20;
const CARD_MARGIN = 4;
const CARD_WIDTH = SCREEN_W - PEEK * 2;
const CARD_HEIGHT = 460;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

type CellUpdate = Partial<Pick<BingoCellDetail, 'completed' | 'completedAt' | 'memo'>>;

interface BingoCellModalProps {
  visible: boolean;
  cells: BingoCellDetail[];
  initialIndex: number;
  onClose: () => void;
  onUpdate: (cellId: string, updates: CellUpdate) => void;
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
}: BingoCellModalProps) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
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
    onUpdate(datePickerCellId, { completedAt: tempDate.toISOString() });
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
                  className="flex-1 text-title-lg mr-3 py-2.5"
                  style={{ color: '#181C1C' /* gray-900 */ }}
                >
                  {item.title}
                </Text>
                <IconButton
                  variant="ghost"
                  onClick={() => handleToggleComplete(item)}
                  icon={
                    item.completed || !!item.completedAt ? (
                      <DoneIcon width={24} height={24} color="#48BE30" /* green-600 */ />
                    ) : (
                      <CheckIcon width={24} height={24} color="#4C5252" /* gray-700 */ />
                    )
                  }
                />
              </View>

              {/* 완료일 */}
              <Text className="text-title-sm mb-2" style={{ color: '#181C1C' /* gray-900 */ }}>
                완료일
              </Text>
              <Pressable
                onPress={() => handleOpenDatePicker(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#F6F7F7' /* gray-100 */,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  alignSelf: 'flex-start',
                  marginBottom: 20,
                }}
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

              {/* 메모 */}
              <Text className="text-title-sm mb-2" style={{ color: '#181C1C' /* gray-900 */ }}>
                메모
              </Text>
              <RNTextInput
                value={item.memo}
                onChangeText={(v) => onUpdate(item.id, { memo: v })}
                placeholder="메모를 입력해주세요."
                placeholderTextColor="#B4BBBB" /* gray-400 */
                multiline
                scrollEnabled
                textAlignVertical="top"
                style={{
                  height: 190,
                  backgroundColor: '#F6F7F7' /* gray-100 */,
                  borderRadius: 20,
                  padding: 16,
                  fontSize: 14,
                  lineHeight: 18,
                  color: '#181C1C' /* gray-900 */,
                }}
              />
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
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
            onPress={() => setDatePickerCellId(null)}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: isDark ? '#181C1C' : '#FDFDFD' /* gray-900 : white */,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: insets.bottom + 16,
              zIndex: 11,
            }}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-body-sm" style={{ color: '#929898' /* gray-500 */ }}>
                완료일 선택
              </Text>
              <Pressable onPress={handleDateConfirm}>
                <Text
                  className="text-body-sm font-semibold"
                  style={{ color: '#6ADE50' /* green-500 */ }}
                >
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
                textColor={isDark ? '#F6F7F7' : '#181C1C'} /* gray-100 : gray-900 */
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </>
      )}
    </Modal>
  );
}
