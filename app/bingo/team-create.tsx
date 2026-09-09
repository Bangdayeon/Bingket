import * as Sentry from '@sentry/react-native';
import { friendSelection, useFriendSelection } from '@/features/team/lib/friend-selection';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Text } from '@/components/Text';
import { PageHeader } from '@/components/PageHeader';
import { SectionLabel } from '@/features/bingo/bingo-edit/SectionLabel';
import { VisibilitySelector } from '@/features/bingo/bingo-edit/VisibilitySelector';
import type { BoardVisibility } from '@/features/profile/lib/profile';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { BingoGoal } from '@/features/bingo/bingo-edit/BingoGoal';
import { WriteBingo } from '@/features/bingo/bingo-edit/WriteBingo';
import { DatePicker } from '@/features/bingo/bingo-edit/DatePicker';
import { FriendPicker } from '@/features/team/components/FriendPicker';
import { createTeam } from '@/features/team/lib/team';
import { TEAM_MAX_MEMBERS, TEAM_MODE_LABEL, type TeamMode, TEAM_MODE_GUIDE } from '@/types/team';

const MAX_INVITES = TEAM_MAX_MEMBERS - 1;
// 시안: 내기 내용은 50자까지
const BET_MAX_LENGTH = 50;

const isTeamMode = (value: string | undefined): value is TeamMode =>
  value === 'shared' || value === 'copied' || value === 'competition';

export default function TeamCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode: TeamMode = isTeamMode(modeParam) ? modeParam : 'shared';

  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedGrid, setSelectedGrid] = useState<string>('3x3');
  const [selectedEditCount, setSelectedEditCount] = useState<string>('0');
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  // 친구 고르기는 친구 목록 화면에서 하고, 그 선택을 공용 저장소로 주고받는다.
  const friendIds = useFriendSelection();

  // 저장소는 화면 밖에 있으므로 새로 들어올 때마다 비운다.
  useEffect(() => {
    friendSelection.set([]);
  }, []);
  const [betText, setBetText] = useState('');
  // 시안: 공개 범위는 경쟁하기 제작 화면에만 있다. 함께하기는 공유판이라 의미가 없다.
  const [visibility, setVisibility] = useState<BoardVisibility>('friends');
  const cellsRef = useRef<string[]>([]);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = useRef(false);
  const markDirty = () => {
    isDirty.current = true;
  };

  const calcEndDate = (start: Date, duration: string): Date => {
    const d = new Date(start);
    if (duration === '1개월') d.setMonth(d.getMonth() + 1);
    else if (duration === '3개월') d.setMonth(d.getMonth() + 3);
    else if (duration === '6개월') d.setMonth(d.getMonth() + 6);
    else if (duration === '1년') d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  const handleDurationSelect = (opt: string) => {
    markDirty();
    setSelectedDuration(opt);
    if (opt !== '직접 지정' && startDate) setEndDate(calcEndDate(startDate, opt));
    if (opt === '직접 지정') setEndDate(null);
  };

  const handlePickerConfirm = () => {
    markDirty();
    if (pickerTarget === 'start') {
      setStartDate(tempDate);
      if (selectedDuration && selectedDuration !== '직접 지정') {
        setEndDate(calcEndDate(tempDate, selectedDuration));
      }
    } else {
      setEndDate(tempDate);
    }
    setPickerTarget(null);
  };

  const isEndDateDisabled = selectedDuration !== null && selectedDuration !== '직접 지정';
  const [cols, rows] = selectedGrid.split('x').map(Number);
  const totalCells = cols * rows;

  const handleSave = () => {
    if (!title.trim()) return setAlertMessage('제목을 입력해주세요.');
    if (!selectedDuration) return setAlertMessage('목표 기간을 선택해주세요.');
    if (!startDate) return setAlertMessage('시작일을 선택해주세요.');
    if (!endDate) return setAlertMessage('종료일을 선택해주세요.');
    if (cellsRef.current.filter((c) => c?.trim()).length < totalCells)
      return setAlertMessage('빙고 칸을 모두 채워주세요.');
    if (friendIds.length === 0) return setAlertMessage('함께할 친구를 한 명 이상 선택해주세요.');
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    if (saving) return;
    setSaving(true);
    try {
      const { teamId } = await createTeam({
        title: title.trim(),
        mode,
        startDate: startDate!.toISOString(),
        endDate: endDate!.toISOString(),
        betText: betText.trim() || null,
        friendIds,
        visibility: mode === 'competition' ? visibility : undefined,
        board: {
          title: title.trim(),
          grid: selectedGrid,
          theme: selectedTheme,
          editCount: selectedEditCount,
          cells: cellsRef.current,
        },
      });
      router.replace({ pathname: '/bingo/team-status', params: { teamId } });
    } catch (e) {
      Sentry.captureException(e);
      setAlertMessage(e instanceof Error ? e.message : '저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader
        title={TEAM_MODE_LABEL[mode]}
        onBack={() => (isDirty.current ? setShowLeaveModal(true) : router.back())}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
      >
        {/* PageHeader 가 제목 아래 8을 이미 주므로 여기 pt 만큼이 실제 간격이 된다 */}
        <Text className="px-4 pb-2 pt-8 text-caption-md text-gray-700">
          {TEAM_MODE_GUIDE[mode]}
        </Text>

        <BingoTitle
          value={title}
          onChange={(v) => {
            markDirty();
            setTitle(v);
          }}
        />

        <BingoGoal
          selectedDuration={selectedDuration}
          onDurationSelect={handleDurationSelect}
          startDate={startDate}
          endDate={endDate}
          isEndDateDisabled={isEndDateDisabled}
          onOpenStartPicker={() => {
            setTempDate(startDate ?? new Date());
            setPickerTarget('start');
          }}
          onOpenEndPicker={() => {
            setTempDate(endDate ?? new Date());
            setPickerTarget('end');
          }}
        />

        <WriteBingo
          title={title}
          selectedGrid={selectedGrid}
          onGridSelect={(v) => {
            markDirty();
            setSelectedGrid(v);
          }}
          selectedEditCount={selectedEditCount}
          onEditCountSelect={(v) => {
            markDirty();
            setSelectedEditCount(v);
          }}
          selectedTheme={selectedTheme}
          onThemeSelect={(v) => {
            markDirty();
            setSelectedTheme(v);
          }}
          cells={[]}
          onCellsChange={(v) => {
            markDirty();
            cellsRef.current = v;
          }}
        />

        {mode === 'competition' && (
          <VisibilitySelector value={visibility} onChange={setVisibility} />
        )}

        {mode === 'competition' && (
          <View className="mt-8 px-4">
            <SectionLabel label="내기 내용" />
            <TextInput
              value={betText}
              onChangeText={(v) => {
                markDirty();
                setBetText(v.slice(0, BET_MAX_LENGTH));
              }}
              placeholder="메모를 입력해주세요."
              multiline
              className="h-20 rounded-2xl bg-gray-200 p-3 text-body-md"
              style={{ textAlignVertical: 'top' }}
            />
            <Text className="mt-1 text-right text-caption-sm text-gray-500">
              {betText.length}/{BET_MAX_LENGTH}
            </Text>
          </View>
        )}

        <View className="mt-8 px-4">
          <SectionLabel
            label={mode === 'competition' ? '친구 선택하기' : '초대할 친구'}
            hint={`(${friendIds.length}/${MAX_INVITES})`}
          />
          <FriendPicker
            selectedIds={friendIds}
            onChange={(ids) => {
              markDirty();
              friendSelection.set(ids);
            }}
            maxCount={MAX_INVITES}
          />
        </View>
      </ScrollView>

      <Modal
        visible={alertMessage !== null}
        title={alertMessage ?? ''}
        variant="single"
        confirmLabel="확인"
        onConfirm={() => setAlertMessage(null)}
      />

      <Modal
        visible={showConfirmModal}
        title={title}
        body={`기간과 칸 내용은 만든 뒤에 바꿀 수 없어요.\n친구 ${friendIds.length}명에게 초대를 보낼까요?`}
        variant="default"
        cancelLabel="한 번 더 보기"
        confirmLabel="초대 보내기"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        onDismiss={() => setShowConfirmModal(false)}
      />

      <Modal
        visible={showLeaveModal}
        title="작성 중인 내용이 있어요"
        body="나가면 지금까지 쓴 내용이 사라져요."
        variant="warning"
        cancelLabel="이어서 쓰기"
        confirmLabel="나가기"
        onCancel={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          router.back();
        }}
        onDismiss={() => setShowLeaveModal(false)}
      />

      {pickerTarget !== null && (
        <DatePicker
          target={pickerTarget}
          tempDate={tempDate}
          startDate={startDate}
          bottomInset={insets.bottom}
          onDateChange={setTempDate}
          onConfirm={handlePickerConfirm}
          onDismiss={() => setPickerTarget(null)}
        />
      )}

      <View
        className="absolute bottom-0 left-0 right-0 bg-surface px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <Button
          label={saving ? '만드는 중...' : '함께 빙고 시작하기'}
          variant="primary"
          size="md"
          onClick={handleSave}
          className="w-full"
        />
      </View>
    </View>
  );
}
