import { useBingoDraft } from '@/features/bingo/lib/use-bingo-draft';
import Loading from '@/components/Loading';
import * as Sentry from '@sentry/react-native';
import { friendSelection, useFriendSelection } from '@/features/team/lib/friend-selection';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
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
import { useTranslation } from 'react-i18next';

const MAX_INVITES = TEAM_MAX_MEMBERS - 1;
const BET_MAX_LENGTH = 50;

const isTeamMode = (value: string | undefined): value is TeamMode =>
  value === 'shared' || value === 'copied' || value === 'competition';

export default function TeamCreateScreen() {
  const { t } = useTranslation();
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
  const friendIds = useFriendSelection();

  useEffect(() => {
    friendSelection.set([]);
  }, []);
  const [betText, setBetText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const betOffset = useRef(0);
  const [visibility, setVisibility] = useState<BoardVisibility>('friends');
  const [cells, setCells] = useState<string[]>([]);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const markDirty = () => {
    setIsDirty(true);
  };

  const draft = useBingoDraft(
    `@bingket/draft-team-${mode}`,
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
      betText,
      friendIds,
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
      setBetText(d.betText ?? '');
      friendSelection.set(d.friendIds ?? []);
      setIsDirty(true);
    },
    isDirty || friendIds.length > 0,
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

  const handlePickerConfirm = () => {
    markDirty();
    if (pickerTarget === 'start') {
      setStartDate(tempDate);
      if (selectedDuration && selectedDuration !== t('home.field.duration.custom')) {
        setEndDate(calcEndDate(tempDate, selectedDuration));
      }
    } else {
      setEndDate(tempDate);
    }
    setPickerTarget(null);
  };

  const isEndDateDisabled =
    selectedDuration !== null && selectedDuration !== t('home.field.duration.custom');
  const [cols, rows] = selectedGrid.split('x').map(Number);
  const totalCells = cols * rows;

  const handleSave = () => {
    if (!title.trim()) return setAlertMessage(t('home.field.title.label'));
    if (!selectedDuration) return setAlertMessage(t('home.field.duration.label'));
    if (!startDate) return setAlertMessage(t('home.field.duration.selectStartDate'));
    if (!endDate) return setAlertMessage(t('common.bingo.endDate'));
    if (cells.filter((c) => c?.trim()).length < totalCells)
      return setAlertMessage(t('home.alert.fillAllCells'));
    if (friendIds.length === 0) return setAlertMessage(t('home.alert.selectFriends'));
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
          cells: cells,
        },
      });
      await draft.clear();
      router.replace({ pathname: '/bingo/team-status', params: { teamId } });
    } catch (e) {
      Sentry.captureException(e);
      setAlertMessage(
        e instanceof Error ? e.message : `${t('home.error.save')} ${t('common.error.retry')}`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (!draft.ready)
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Loading />
      </View>
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
      style={{ paddingTop: insets.top }}
    >
      <PageHeader
        title={TEAM_MODE_LABEL[mode]}
        onBack={() => (isDirty ? setShowLeaveModal(true) : router.back())}
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ gap: 32, paddingBottom: 240 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
      >
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

        {mode === 'competition' && (
          <VisibilitySelector value={visibility} onChange={setVisibility} />
        )}

        {mode === 'competition' && (
          <View
            className="px-4"
            onLayout={(event) => {
              betOffset.current = event.nativeEvent.layout.y;
            }}
          >
            <SectionLabel label={t('home.field.bet.label')} />
            <TextInput
              onFocus={() =>
                scrollRef.current?.scrollTo({
                  y: Math.max(0, betOffset.current - 16),
                  animated: true,
                })
              }
              value={betText}
              onChangeText={(v) => {
                markDirty();
                setBetText(v.slice(0, BET_MAX_LENGTH));
              }}
              placeholder={t('common.bingo.memoPlaceholder')}
              multiline
              className="h-20 rounded-2xl bg-gray-200 p-3 text-body-md text-gray-900 placeholder:text-gray-500"
              style={{ textAlignVertical: 'top' }}
            />
            <Text className="mt-1 text-right text-caption-sm text-gray-500">
              {betText.length}/{BET_MAX_LENGTH}
            </Text>
          </View>
        )}

        <View className="px-4">
          <SectionLabel
            label={
              mode === 'competition' ? t('home.field.friend.label') : t('home.field.friend.invite')
            }
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
        confirmLabel={t('common.confirm')}
        onConfirm={() => setAlertMessage(null)}
      />

      <Modal
        visible={showConfirmModal}
        title={title}
        body={t('home.modal.friend.title', { count: friendIds.length })}
        variant="default"
        cancelLabel={t('home.modal.friend.cancel')}
        confirmLabel={t('home.modal.friend.confirm')}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        onDismiss={() => setShowConfirmModal(false)}
      />

      <Modal
        visible={showLeaveModal}
        title={t('home.modal.unsaved.title')}
        body={t('home.modal.unsaved.body')}
        variant="warning"
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

      <View className="bg-surface px-4 pt-3" style={{ paddingBottom: insets.bottom + 8 }}>
        <Button
          label={saving ? t('home.btnLabel.creating') : t('home.btnLabel.startBingoWith')}
          variant="primary"
          size="md"
          onClick={handleSave}
          className="w-full"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
