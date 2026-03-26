import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { TextInput } from '@/components/TextInput';
import { BingoAddHeader } from '@/features/bingo/bingo-add/Header';
import { BingoGoal } from '@/features/bingo/bingo-add/BingoGoal';
import { WriteBingo } from '@/features/bingo/bingo-add/WriteBingo';
import { DatePicker } from '@/features/bingo/bingo-add/DatePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBingo } from '@/features/bingo/lib/bingo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BingoAddScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loadDraft } = useLocalSearchParams<{ loadDraft?: string }>();

  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedGrid, setSelectedGrid] = useState<string>('3x3');
  const cellsRef = useRef<string[]>([]);
  const [initialCells, setInitialCells] = useState<string[]>([]);
  const [writeBingoKey, setWriteBingoKey] = useState(0);
  const [selectedEditCount, setSelectedEditCount] = useState<string>('0');
  const [selectedTheme, setSelectedTheme] = useState<string>('기본');
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

  const handleSave = async () => {
    if (!title.trim()) return showAlert('제목을 입력해주세요.');
    if (!selectedDuration) return showAlert('목표 기간을 선택해주세요.');
    if (!startDate) return showAlert('시작일을 선택해주세요.');
    if (!endDate) return showAlert('종료일을 선택해주세요.');
    if (cellsRef.current.filter((c) => c?.trim()).length < totalCells)
      return showAlert('빙고 칸을 모두 채워주세요.');
    try {
      await createBingo({
        title,
        duration: selectedDuration,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        grid: selectedGrid,
        editCount: selectedEditCount,
        theme: selectedTheme,
        cells: cellsRef.current,
      });
      await AsyncStorage.removeItem('@bingket/draft-bingo');
      router.replace('/(tabs)');
    } catch (e) {
      console.error('[createBingo] 오류:', e);
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
      startDate: startDate?.toISOString() ?? null,
      endDate: endDate?.toISOString() ?? null,
      cells: cellsRef.current,
    };
    await AsyncStorage.setItem('@bingket/draft-bingo', JSON.stringify(data));
    showAlert('임시 저장되었습니다.\n홈 화면의 기록 탭에서 확인할 수 있어요.', () =>
      router.replace('/(tabs)'),
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      <BingoAddHeader onBack={handleBack} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View className="px-5 pt-5 pb-8">
          <Text className="text-title-md mb-2">제목</Text>
          <TextInput
            value={title}
            onChangeText={(v) => {
              markDirty();
              setTitle(v);
            }}
            placeholder="제목을 입력해주세요."
          />
        </View>

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
        visible={showLeaveModal}
        title="변경사항을 저장하지 않았어요"
        body="변경사항을 저장할까요?"
        variant="warning"
        cancelLabel="이어서 편집하기"
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
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-5 bg-white dark:bg-gray-900 pt-3 border-t border-gray-100 dark:border-gray-800"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <Button label="임시 저장" variant="secondary" onClick={handleTempSave} className="flex-1" />
        <Button label="저장하기" variant="primary" onClick={handleSave} className="flex-1" />
      </View>
    </View>
  );
}
