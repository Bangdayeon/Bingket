import * as Sentry from '@sentry/react-native';
import Button from '@/components/Button';
import { Text } from '@/components/Text';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { BingoGoal } from '@/features/bingo/bingo-edit/BingoGoal';
import { WriteBingo } from '@/features/bingo/bingo-edit/WriteBingo';
import { DatePicker } from '@/features/bingo/bingo-edit/DatePicker';
import { useBingoDraft } from '@/features/bingo/lib/use-bingo-draft';
import Loading from '@/components/Loading';
import { createBingo } from '@/features/bingo/lib/bingo';
import { VisibilitySelector } from '@/features/bingo/bingo-edit/VisibilitySelector';
import type { BoardVisibility } from '@/features/profile/lib/profile';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { CoachMarkTarget } from '@/features/coachmark/CoachMarkTarget';
import { useCoachMarkScrollIntoView } from '@/features/coachmark/use-coach-mark-scroll';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function BingoAddScreen() {
  const { t } = useTranslation();

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedGrid, setSelectedGrid] = useState<string>('3x3');
  const [cells, setCells] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const coachScroll = useCoachMarkScrollIntoView(scrollRef, {
    'add-info': 'top',
    'add-temp-save': 'end',
  });
  const [selectedEditCount, setSelectedEditCount] = useState<string>('0');
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [visibility, setVisibility] = useState<BoardVisibility>('friends');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const [isDirty, setIsDirty] = useState(false);
  const markDirty = () => {
    setIsDirty(true);
  };

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [afterAlertAction, setAfterAlertAction] = useState<(() => void) | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const draft = useBingoDraft(
    '@bingket/draft-bingo',
    {
      title,
      selectedDuration,
      selectedGrid,
      selectedEditCount,
      selectedTheme,
      visibility,
      startDate: startDate?.toISOString() ?? null,
      endDate: endDate?.toISOString() ?? null,
      cells,
    },
    (d) => {
      setTitle(d.title ?? '');
      setSelectedDuration(d.selectedDuration ?? null);
      setSelectedGrid(d.selectedGrid ?? '3x3');
      setSelectedEditCount(d.selectedEditCount ?? '0');
      setSelectedTheme(d.selectedTheme ?? 'default');
      setVisibility(d.visibility ?? 'friends');
      setStartDate(d.startDate ? new Date(d.startDate) : null);
      setEndDate(d.endDate ? new Date(d.endDate) : null);
      setCells(d.cells ?? []);
      setIsDirty(true);
    },
    isDirty,
  );

  const calcEndDate = (start: Date, duration: string): Date => {
    const d = new Date(start);
    if (duration === t('home.field.duration.oneMonth')) d.setMonth(d.getMonth() + 1);
    else if (duration === t('home.field.duration.threeMonths')) d.setMonth(d.getMonth() + 3);
    else if (duration === t('home.field.duration.sixMonths')) d.setMonth(d.getMonth() + 6);
    else if (duration === t('home.field.duration.oneYear')) d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  const handleDurationSelect = (opt: string) => {
    markDirty();
    setSelectedDuration(opt);
    if (opt !== t('home.field.duration.custom') && startDate)
      setEndDate(calcEndDate(startDate, opt));
    if (opt === t('home.field.duration.custom')) setEndDate(null);
  };

  const handleStartDateConfirm = (date: Date) => {
    markDirty();
    setStartDate(date);
    if (selectedDuration && selectedDuration !== t('home.field.duration.custom')) {
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

  const isEndDateDisabled =
    selectedDuration !== null && selectedDuration !== t('home.field.duration.custom');

  const [cols, rows] = selectedGrid.split('x').map(Number);
  const totalCells = cols * rows;

  const handleBack = () => {
    if (isDirty) setShowLeaveModal(true);
    else router.back();
  };

  const showAlert = (msg: string, after?: () => void) => {
    setAlertMessage(msg);
    setAfterAlertAction(after ? () => after : null);
  };

  const handleSave = () => {
    if (!title.trim()) return showAlert(t('home.field.title.label'));
    if (!selectedDuration) return showAlert(t('home.field.duration.label'));
    if (!startDate) return showAlert(t('home.field.duration.selectStartDate'));
    if (!endDate) return showAlert(t('home.field.duration.selectEndDate'));
    if (cells.filter((c) => c?.trim()).length < totalCells)
      return showAlert(t('home.alert.fillAllCells'));
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
        cells: cells,
      });
      await draft.clear();
      router.replace('/(tabs)');
    } catch (e) {
      Sentry.captureException(e);
      showAlert(`${t('home.error.save')} ${t('common.error.retry')}`);
    }
  };

  const handleTempSave = async () => {
    if (!title.trim()) return showAlert(t('home.field.title.label'));
    try {
      await draft.save();
    } catch (e) {
      Sentry.captureException(e);
      return showAlert(t('home.error.save'));
    }
    showAlert(t('home.btnLabel.temporarySave'), () => router.replace('/(tabs)'));
  };

  if (!draft.ready)
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Loading />
      </View>
    );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader onBack={handleBack} />

      <ScrollView
        ref={scrollRef}
        {...coachScroll}
        className="flex-1"
        contentContainerStyle={{ gap: 32, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View className="px-4 pb-2 pt-7">
          <Text className="text-title-lg font-pretendard-medium text-gray-900">
            {t('home.addBingo')}
          </Text>
        </View>

        <CoachMarkTarget id="add-info" className="gap-8">
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
        </CoachMarkTarget>

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
          cells={cells}
          onDraftCellsChange={(v) => {
            markDirty();
            setCells(v);
          }}
          onCellsChange={(v) => {
            markDirty();
            setCells(v);
          }}
        />

        <VisibilitySelector
          value={visibility}
          onChange={(v) => {
            markDirty();
            setVisibility(v);
          }}
        />

        <View className="flex-row gap-2 px-4">
          <CoachMarkTarget id="add-temp-save" className="flex-1">
            <Button
              label={t('home.btnLabel.temporarySave')}
              variant="secondary"
              size="md"
              onClick={handleTempSave}
              className="w-full"
            />
          </CoachMarkTarget>
          <Button
            label={t('home.btnLabel.save')}
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
        confirmLabel={t('common.confirm')}
        onConfirm={() => {
          setAlertMessage(null);
          afterAlertAction?.();
          setAfterAlertAction(null);
        }}
      />

      <Modal
        visible={showConfirmModal}
        title={title}
        body={t('home.modal.save.body')}
        variant="default"
        cancelLabel={t('home.modal.save.cancel')}
        confirmLabel={t('home.modal.save.confirm')}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        onDismiss={() => setShowConfirmModal(false)}
      />

      <Modal
        visible={showLeaveModal}
        title={t('home.modal.unsaved.title')}
        body={t('home.modal.unsaved.body')}
        cancelLabel={t('home.modal.unsaved.cancel')}
        confirmLabel={t('home.modal.unsaved.confirm')}
        onCancel={() => setShowLeaveModal(false)}
        onConfirm={async () => {
          await draft.clear();
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
