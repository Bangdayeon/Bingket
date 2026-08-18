import * as Sentry from '@sentry/react-native';
import { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Text } from '@/components/Text';
import { BingoEditHeader } from '@/features/bingo/bingo-edit/Header';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { BingoGoal } from '@/features/bingo/bingo-edit/BingoGoal';
import { WriteBingo } from '@/features/bingo/bingo-edit/WriteBingo';
import { DatePicker } from '@/features/bingo/bingo-edit/DatePicker';
import { FriendPicker } from '@/features/team/components/FriendPicker';
import { createTeam } from '@/features/team/lib/team';
import {
  TEAM_MAX_MEMBERS,
  TEAM_MODE_DESCRIPTION,
  TEAM_MODE_LABEL,
  type TeamMode,
} from '@/types/team';

const MAX_INVITES = TEAM_MAX_MEMBERS - 1;
const BET_MAX_LENGTH = 100;

const isTeamMode = (value: string | undefined): value is TeamMode =>
  value === 'shared' || value === 'copied' || value === 'own';

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
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [betText, setBetText] = useState('');
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
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <BingoEditHeader
        title={TEAM_MODE_LABEL[mode]}
        onBack={() => (isDirty.current ? setShowLeaveModal(true) : router.back())}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
      >
        <View className="mx-5 mt-4 mb-2 bg-green-100 rounded-2xl px-4 py-3">
          <Text className="text-body-sm" style={{ color: '#4C5252' /* gray-700 */ }}>
            {TEAM_MODE_DESCRIPTION[mode]}
          </Text>
          <Text className="text-caption-sm mt-1" style={{ color: '#4C5252' /* gray-700 */ }}>
            {mode === 'shared'
              ? '칸 내용은 방장인 나만 고칠 수 있어요.'
              : '친구들도 같은 기간으로 자기 빙고를 채워요.'}
          </Text>
        </View>

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

        {mode === 'own' && (
          <View className="mx-5 mt-8">
            <Text className="text-title-md mb-3 font-pretendard-semibold">내기 내용</Text>
            <TextInput
              value={betText}
              onChangeText={(v) => {
                markDirty();
                setBetText(v.slice(0, BET_MAX_LENGTH));
              }}
              placeholder="예) 진 사람이 커피 사기"
              placeholderTextColor="#B4BBBB" /* gray-400 */
              multiline
              className="bg-gray-100 rounded-2xl p-4 text-body-md min-h-[80px]"
              style={{ textAlignVertical: 'top' }}
            />
            <Text className="text-caption-sm text-gray-400 mt-1 text-right">
              {betText.length}/{BET_MAX_LENGTH}
            </Text>
          </View>
        )}

        <View className="mx-5 mt-8">
          <Text className="text-title-md mb-3 font-pretendard-semibold">함께할 친구</Text>
          <FriendPicker
            selectedIds={friendIds}
            onChange={(ids) => {
              markDirty();
              setFriendIds(ids);
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
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-5 bg-white pt-3 border-t border-gray-100"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <Button
          label={saving ? '만드는 중...' : '팀 빙고 만들기'}
          variant="primary"
          onClick={handleSave}
          className="flex-1"
        />
      </View>
    </View>
  );
}
