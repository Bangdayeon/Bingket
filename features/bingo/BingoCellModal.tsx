import DateTimePicker from '@react-native-community/datetimepicker';
import { FIXED, useColors } from '@/lib/use-colors';
import { useResolvedScheme } from '@/lib/color-scheme';
import { DateInput } from '@/components/DateInput';
import DoneIcon from '@/assets/icons/ic_done.svg';
import CloseIcon from '@/assets/icons/ic_close.svg';
import { BingoCellDetail } from '@/types/bingo-cell';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  TextInput as RNTextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { TABLET_MAX_CONTENT_WIDTH } from '@/lib/use-responsive';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileAvatar } from '@/components/ProfileAvatar';

// 시안: 칸 메모는 300자까지
const MEMO_MAX_LENGTH = 300;
const PEEK = 13;
const CARD_MARGIN = 4;
const CARD_HEIGHT = 436;

type CellUpdate = Partial<Pick<BingoCellDetail, 'completed' | 'completedAt' | 'memo'>>;

/** 팀 빙고에서만 넘긴다. 완료자 표시와 해제 권한 판정에 쓴다. */
export interface CellTeamContext {
  currentUserId: string;
  members: { userId: string; displayName: string; avatarUrl: string | null }[];
  /** 'YYYY-MM-DD'. 완료일 선택 범위를 기간 안으로 제한한다 */
  startDate: string;
  endDate: string;
}

/** 메모 저장 상태. 디바운스 타이머를 부모가 들고 있어 저장 시점도 부모만 안다. */
export type MemoSaveState = 'saving' | 'saved' | 'error';

interface BingoCellModalProps {
  visible: boolean;
  cells: BingoCellDetail[];
  initialIndex: number;
  onClose: () => void;
  onUpdate: (cellId: string, updates: CellUpdate) => void;
  /** 칸 id → 메모 저장 상태 */
  memoSaveState?: Record<string, MemoSaveState | undefined>;
  /** 완료된 빙고: 메모만 편집 가능, 완료 토글/완료일 숨김 */
  readOnly?: boolean;
  team?: CellTeamContext;
}

/** 메모 상자 아래 우측 줄: 저장 상태 + 글자수 */
function MemoFooter({ length, saveState }: { length: number; saveState?: MemoSaveState }) {
  return (
    <View className="flex-row items-center justify-end gap-2 mt-2">
      {saveState === 'saved' && <Text className="text-caption-md text-green-500">저장됨</Text>}
      {saveState === 'error' && <Text className="text-caption-md text-danger">저장 실패</Text>}
      <Text
        className={`text-caption-md ${length >= MEMO_MAX_LENGTH ? 'text-gray-700' : 'text-gray-500'}`}
      >
        {length}/{MEMO_MAX_LENGTH}
      </Text>
    </View>
  );
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
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

export function BingoCellModal({
  visible,
  cells,
  initialIndex,
  onClose,
  onUpdate,
  memoSaveState = {},
  readOnly = false,
  team,
}: BingoCellModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = Math.min(width, TABLET_MAX_CONTENT_WIDTH) - PEEK * 2;
  const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
  const flatListRef = useRef<FlatList<BingoCellDetail>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [datePickerCellId, setDatePickerCellId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  /**
   * 메모 편집 중인 칸. 카드는 460px라 키보드가 올라오면 하단 메모가 가려진다.
   * 편집 중에는 카드를 숨기고 메모 입력창만 화면 위쪽에 따로 띄운다.
   */
  const [editingMemoCellId, setEditingMemoCellId] = useState<string | null>(null);
  const editingMemoCell = cells.find((c) => c.id === editingMemoCellId) ?? null;

  const closeMemoEditor = () => {
    Keyboard.dismiss();
    setEditingMemoCellId(null);
  };

  useEffect(() => {
    if (!visible) {
      setEditingMemoCellId(null);
      return;
    }
    setCurrentIndex(initialIndex);
    const t = setTimeout(() => {
      if (cells.length > 0 && initialIndex < cells.length) {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [visible, initialIndex, cells.length]);

  /** 팀 빙고에서 남이 채운 칸은 해제할 수 없다 (DB 트리거와 같은 규칙) */
  const lockedByOther = (cell: BingoCellDetail): boolean =>
    Boolean(team && cell.completed && cell.completedBy && cell.completedBy !== team.currentUserId);

  const memberOf = (userId: string | null) =>
    userId ? team?.members.find((m) => m.userId === userId) : undefined;

  const handleToggleComplete = (cell: BingoCellDetail) => {
    if (lockedByOther(cell)) return;
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // 안드로이드 백 버튼: 위에 뜬 것부터 하나씩 닫는다. 날짜 시트 → 메모 편집 → 셀 모달.
      onRequestClose={
        datePickerCellId
          ? () => setDatePickerCellId(null)
          : editingMemoCell
            ? closeMemoEditor
            : onClose
      }
    >
      {/* Backdrop — 뒤의 빙고판을 흐리게 깔아둔다 */}
      <BlurView
        intensity={20}
        tint="dark"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Pressable className="absolute bottom-0 left-0 right-0 top-0 bg-scrim/70" onPress={onClose} />

      {/* Centered content — 메모 편집 중에는 숨긴다.
          언마운트하면 FlatList가 첫 칸으로 돌아가므로 투명하게만 만든다. */}
      <View
        style={{ flex: 1, justifyContent: 'center', opacity: editingMemoCell ? 0 : 1 }}
        pointerEvents={editingMemoCell ? 'none' : 'box-none'}
      >
        {/* 몇 번째 칸인지 — 카드 위 */}
        <View className="items-center mb-4" pointerEvents="none">
          <Text className="text-body-sm text-white">
            {currentIndex + 1} / {cells.length}
          </Text>
        </View>

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
              className="overflow-hidden rounded-3xl bg-surface p-4"
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginHorizontal: CARD_MARGIN,
                // 시안 드롭섀도: 0/0 blur 12, 검정 25%
                shadowColor: FIXED.fixedBlack,
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
                elevation: 6,
              }}
            >
              {/* Title + check button */}
              <View className="flex-row items-start mb-5 ">
                <Text
                  className="mr-3 flex-1 py-2.5 text-title-sm font-pretendard-semibold text-gray-900"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {normalizeTitle(item.title)}
                </Text>
                {!readOnly && (
                  <Pressable
                    onPress={() => handleToggleComplete(item)}
                    hitSlop={8}
                    style={{ opacity: lockedByOther(item) ? 0.4 : 1 }}
                    className="mt-1"
                  >
                    {item.completed ? (
                      // ic_done은 원 안에서 체크가 파인 모양이라 그대로 두면 채워진 녹색 원이 된다
                      <DoneIcon width={28} height={28} className="text-green-400" />
                    ) : (
                      // 빈 테두리 원은 에셋이 없어 View로 만든다
                      <View
                        className="rounded-full border-gray-300"
                        style={{ width: 28, height: 28, borderWidth: 1.5 }}
                      />
                    )}
                  </Pressable>
                )}
              </View>

              {/* 팀 빙고: 이 칸을 누가 채웠는지 */}
              {team && item.completed && item.completedBy && (
                <View className="flex-row items-center gap-2 mb-4">
                  <ProfileAvatar avatarUrl={memberOf(item.completedBy)?.avatarUrl} size={24} />
                  <Text className="flex-1 text-body-sm text-gray-700" numberOfLines={1}>
                    {item.completedBy === team.currentUserId
                      ? '내가 채웠어요'
                      : `${memberOf(item.completedBy)?.displayName ?? '탈퇴한 멤버'}님이 채웠어요`}
                  </Text>
                </View>
              )}

              {/* 완료일 — 채운 칸에만 보여준다.
                  아직 안 채운 칸에 '날짜 선택'을 띄우면 순서가 거꾸로 읽힌다.
                  체크하면 현재 시각이 자동으로 찍히고, 그 뒤 날짜를 고쳐 잡으면 된다. */}
              {item.completed && (
                <>
                  <Text className="mb-2 text-body-md text-gray-900">완료일</Text>
                  <DateInput
                    value={formatDate(item.completedAt) || '날짜 선택'}
                    onPress={() => handleOpenDatePicker(item)}
                    disabled={readOnly || lockedByOther(item)}
                    className="mb-5 self-start"
                  />
                </>
              )}

              {/* 메모 */}
              <Text className="mb-2 text-body-md text-gray-900">메모</Text>
              {/* 여기서는 미리보기만 한다. 실제 입력은 아래 메모 편집 오버레이에서. */}
              <Pressable onPress={() => setEditingMemoCellId(item.id)}>
                <RNTextInput
                  value={item.memo}
                  placeholder="메모를 입력해주세요."
                  multiline
                  scrollEnabled={false}
                  editable={false}
                  pointerEvents="none"
                  textAlignVertical="top"
                  className="h-[190px] rounded-2xl bg-gray-200 p-3 text-body-md text-gray-900 placeholder:text-gray-500"
                />
                <MemoFooter length={item.memo?.length ?? 0} saveState={memoSaveState[item.id]} />
              </Pressable>

              {/* 팀 메모는 전원이 고칠 수 있어, 조용히 바뀌지 않도록 마지막 수정자를 남긴다 */}
              {team && item.memoUpdatedBy && item.memoUpdatedBy !== team.currentUserId && (
                <Text className="text-caption-sm mt-2 text-gray-500">
                  마지막 수정: {memberOf(item.memoUpdatedBy)?.displayName ?? '탈퇴한 멤버'}
                </Text>
              )}
            </View>
          )}
        />

        {/* 닫기 */}
        <View className="items-center mt-6">
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <CloseIcon width={24} height={24} className="text-gray-900" />
          </Pressable>
        </View>
      </View>

      {/* 메모 편집 — 키보드에 가리지 않도록 화면 위쪽에 붙인다 */}
      {editingMemoCell && (
        <>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={closeMemoEditor}
          />
          <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}
            pointerEvents="box-none"
          >
            <View
              className="rounded-3xl bg-white p-6"
              style={{ width: CARD_WIDTH, marginTop: insets.top + 16 }}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-title-sm font-pretendard-medium text-gray-900">메모</Text>
                {/* 버튼 자체 좌우 패딩(14)만큼 당겨서 라벨이 카드 안쪽 여백에 맞게 선다. */}
                <Button
                  label="완료"
                  variant="ghost"
                  size="sm"
                  onClick={closeMemoEditor}
                  className="-mr-[14px]"
                />
              </View>

              <Text className="text-body-sm mb-3 text-gray-500 placeholder:text-gray-500">
                {normalizeTitle(editingMemoCell.title)}
              </Text>

              <View style={{ position: 'relative' }}>
                <RNTextInput
                  autoFocus
                  value={editingMemoCell.memo}
                  onChangeText={(v) => onUpdate(editingMemoCell.id, { memo: v })}
                  placeholder="메모를 입력해주세요."
                  multiline
                  scrollEnabled
                  textAlignVertical="top"
                  maxLength={MEMO_MAX_LENGTH}
                  className="h-[298px] rounded-2xl bg-gray-200 p-3 text-body-md text-gray-900 placeholder:text-gray-500"
                />
                <MemoFooter
                  length={editingMemoCell.memo?.length ?? 0}
                  saveState={memoSaveState[editingMemoCell.id]}
                />
              </View>
            </View>
          </View>
        </>
      )}

      {/* Date picker sheet */}
      {datePickerCellId && (
        <>
          {/* 4방향을 다 줘야 실제로 눌린다. 크기가 없으면 이 backdrop을 그냥 통과해
            아래 깔린 전체화면 Pressable이 먹고 셀 모달째 닫힌다.
            날짜는 '확인'에서만 확정되므로 여기서 닫으면 고른 값은 버려진다. */}
          <Pressable
            className="absolute bottom-0 left-0 right-0 top-0 z-10"
            onPress={() => setDatePickerCellId(null)}
          />
          {/* 하단 여백은 인라인 스타일로 준다. `pb-[${'{'}...{'}'}px]` 같은 동적 클래스는
              NativeWind가 빌드 타임에 생성하지 못해 패딩이 조용히 사라진다. */}
          <View
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[16px] bg-white px-4 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-title-sm">완료일 선택</Text>
              <Pressable onPress={handleDateConfirm}>
                <Text className="text-title-sm text-green-500">확인</Text>
              </Pressable>
            </View>
            <View style={{ height: 216 }}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                // 팀 빙고는 진행 기간 밖의 날짜를 DB가 거부하므로 선택 자체를 막는다
                minimumDate={team ? new Date(`${team.startDate}T00:00:00`) : undefined}
                maximumDate={
                  team && new Date(`${team.endDate}T23:59:59`) < new Date()
                    ? new Date(`${team.endDate}T23:59:59`)
                    : new Date()
                }
                onChange={(_, date) => {
                  if (date) setTempDate(date);
                }}
                locale="ko-KR"
                textColor={colors.gray[900]}
                // 글자색만 주면 스피너 선택 바와 컬럼 배경은 밝은 채로 남는다.
                themeVariant={scheme}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </>
      )}
    </Modal>
  );
}
