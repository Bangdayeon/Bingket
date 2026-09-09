import * as Sentry from '@sentry/react-native';
import Button from '@/components/Button';
import { Text } from '@/components/Text';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { BingoGoal } from '@/features/bingo/bingo-edit/BingoGoal';
import { WriteBingo } from '@/features/bingo/bingo-edit/WriteBingo';
import { DatePicker } from '@/features/bingo/bingo-edit/DatePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBingo } from '@/features/bingo/lib/bingo';
import { VisibilitySelector } from '@/features/bingo/bingo-edit/VisibilitySelector';
import type { BoardVisibility } from '@/features/profile/lib/profile';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BingoAddScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loadDraft } = useLocalSearchParams<{
    loadDraft?: string;
  }>();

  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedGrid, setSelectedGrid] = useState<string>('3x3');
  const cellsRef = useRef<string[]>([]);
  const [initialCells, setInitialCells] = useState<string[]>([]);
  const [writeBingoKey, setWriteBingoKey] = useState(0);
  const [selectedEditCount, setSelectedEditCount] = useState<string>('0');
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [visibility, setVisibility] = useState<BoardVisibility>('friends');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const isDirty = useRef(false);
  const markDirty = () => {
    isDirty.current = true;
  };

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [afterAlertAction, setAfterAlertAction] = useState<(() => void) | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 드래프트 불러오기
  useEffect(() => {
    if (!loadDraft) return;
    AsyncStorage.getItem('@bingket/draft-bingo').then((raw) => {
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title) setTitle(d.title);
      if (d.selectedDuration) setSelectedDuration(d.selectedDuration);
      if (d.selectedGrid) setSelectedGrid(d.selectedGrid);
      if (d.selectedEditCount) setSelectedEditCount(d.selectedEditCount);
      if (d.selectedTheme) setSelectedTheme(d.selectedTheme);
      if (d.visibility) setVisibility(d.visibility);
      if (d.startDate) setStartDate(new Date(d.startDate));
      if (d.endDate) setEndDate(new Date(d.endDate));
      if (d.cells) {
        cellsRef.current = d.cells;
        setInitialCells(d.cells);
        setWriteBingoKey((k) => k + 1);
      }
    });
  }, [loadDraft]);

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

  const handleStartDateConfirm = (date: Date) => {
    markDirty();
    setStartDate(date);
    if (selectedDuration && selectedDuration !== '직접 지정') {
      setEndDate(calcEndDate(date, selectedDuration));
    }
  };

  const handlePickerConfirm = () => {
    if (pickerTarget === 'start') handleStartDateConfirm(tempDate);
    else {
      markDirty();
      setEndDate(tempDate);
    }
    setPickerTarget(null);
  };

  const isEndDateDisabled = selectedDuration !== null && selectedDuration !== '직접 지정';

  const [cols, rows] = selectedGrid.split('x').map(Number);
  const totalCells = cols * rows;

  const handleBack = () => {
    if (isDirty.current) setShowLeaveModal(true);
    else router.back();
  };

  const showAlert = (msg: string, after?: () => void) => {
    setAlertMessage(msg);
    setAfterAlertAction(after ? () => after : null);
  };

  const handleSave = () => {
    if (!title.trim()) return showAlert('제목을 입력해주세요.');
    if (!selectedDuration) return showAlert('목표 기간을 선택해주세요.');
    if (!startDate) return showAlert('시작일을 선택해주세요.');
    if (!endDate) return showAlert('종료일을 선택해주세요.');
    if (cellsRef.current.filter((c) => c?.trim()).length < totalCells)
      return showAlert('빙고 칸을 모두 채워주세요.');
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    try {
      await createBingo({
        title,
        duration: selectedDuration!,
        startDate: startDate!.toISOString(),
        endDate: endDate!.toISOString(),
        grid: selectedGrid,
        editCount: selectedEditCount,
        theme: selectedTheme,
        visibility,
        cells: cellsRef.current,
      });
      await AsyncStorage.removeItem('@bingket/draft-bingo');
      router.replace('/(tabs)');
    } catch (e) {
      Sentry.captureException(e);
      showAlert('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleTempSave = async () => {
    if (!title.trim()) return showAlert('제목을 입력해주세요.');
    const data = {
      title,
      selectedDuration,
      selectedGrid,
      selectedEditCount,
      selectedTheme,
      visibility,
      startDate: startDate?.toISOString() ?? null,
      endDate: endDate?.toISOString() ?? null,
      cells: cellsRef.current,
    };
    await AsyncStorage.setItem('@bingket/draft-bingo', JSON.stringify(data));
    showAlert('임시 저장되었습니다.\n홈 화면에서 이어서 만들 수 있어요.', () =>
      router.replace('/(tabs)'),
    );
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* 뒤로가기 줄만 고정한다. 제목과 저장 버튼은 내용과 함께 스크롤된다. */}
      <PageHeader onBack={handleBack} />

      <ScrollView
        className="flex-1"
        // 섹션 간격은 여기 한 곳에서 준다. 섹션마다 자기 패딩을 들면 제각각이 된다.
        contentContainerStyle={{ gap: 32, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        // 저장 버튼이 하단 고정 바였을 땐 false가 맞았다(고정 바가 키보드에 밀려 튐).
        // 버튼이 스크롤 안으로 들어온 지금은 반대로, 키보드 위로 올릴 수 없게 막는다.
        automaticallyAdjustKeyboardInsets
      >
        {/* 제목은 내용과 함께 스크롤된다. 화면 위에 고정되는 건 뒤로가기 줄뿐이다. */}
        <View className="px-4 pb-2 pt-7">
          <Text className="text-title-lg font-pretendard-medium text-gray-900">빙고 추가하기</Text>
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
          cells={initialCells}
          key={writeBingoKey}
          onCellsChange={(v) => {
            markDirty();
            cellsRef.current = v;
          }}
        />

        <VisibilitySelector
          value={visibility}
          onChange={(v) => {
            markDirty();
            setVisibility(v);
          }}
        />

        {/* 저장 버튼도 고정하지 않는다 — 화면이 짧아 보이고 스크롤 영역을 먹는다. */}
        <View className="flex-row gap-2 px-4">
          <Button
            label="임시 저장"
            variant="secondary"
            size="md"
            onClick={handleTempSave}
            className="flex-1"
          />
          <Button
            label="저장하기"
            variant="primary"
            size="md"
            onClick={handleSave}
            className="flex-1"
          />
        </View>
      </ScrollView>

      <Modal
        visible={alertMessage !== null}
        title={alertMessage ?? ''}
        variant="single"
        confirmLabel="확인"
        onConfirm={() => {
          setAlertMessage(null);
          afterAlertAction?.();
          setAfterAlertAction(null);
        }}
      />

      <Modal
        visible={showConfirmModal}
        title={title}
        body={
          '목표 기간, 칸 개수, 수정 가능 횟수는\n저장 후 수정이 불가능합니다.\n이대로 빙고를 만들까요?'
        }
        variant="default"
        cancelLabel="한 번 더 보기"
        confirmLabel="빙고 만들기"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        onDismiss={() => setShowConfirmModal(false)}
      />

      <Modal
        visible={showLeaveModal}
        title="저장하지 않은 변경사항이 있어요"
        body="지금 나가면 변경 사항이 저장되지 않아요."
        cancelLabel="계속 수정"
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
    </View>
  );
}
