import * as Sentry from '@sentry/react-native';
import Button from '@/components/Button';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState } from '@/components/ErrorState';
import { SectionLabel } from '@/features/bingo/bingo-edit/SectionLabel';
import DeleteIcon from '@/assets/icons/ic_delete.svg';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { AddEachBingo } from '@/features/bingo/bingo-edit/AddEachBingo';
import { fetchBingoForEdit, updateBingo, deleteBingo } from '@/features/bingo/lib/bingo';
import { VisibilitySelector } from '@/features/bingo/bingo-edit/VisibilitySelector';
import type { BoardVisibility } from '@/features/profile/lib/profile';
import { fetchTeamByBoardId, leaveTeam } from '@/features/team/lib/team';
import { fetchThemes } from '@/features/bingo/lib/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import Loading from '@/components/Loading';
import { useTranslation } from 'react-i18next';

export default function BingoModifyScreen() {
  const { t } = useTranslation();

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bingoId } = useLocalSearchParams<{ bingoId: string }>();

  const [loading, setLoading] = useState(true);
  const [grid, setGrid] = useState('3x3');
  const [maxEdits, setMaxEdits] = useState(0);
  const [title, setTitle] = useState('');
  const [cells, setCells] = useState<string[]>([]);
  const [cellIds, setCellIds] = useState<string[]>([]);
  const [cellOriginalEditCounts, setCellOriginalEditCounts] = useState<number[]>([]);
  const [cellEdits, setCellEdits] = useState<number[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [visibility, setVisibility] = useState<BoardVisibility>('friends');
  const [themes, setThemes] = useState<{ id: string; displayName: string }[]>([]);

  const [loadFailed, setLoadFailed] = useState(false);

  const init = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const themeMap = await fetchThemes();
      const uniqueThemes = Object.values(themeMap).filter(
        (v, i, arr) => arr.findIndex((t) => t.id === v.id) === i,
      );
      setThemes(uniqueThemes.map((t) => ({ id: t.id, displayName: t.displayName })));

      if (!bingoId) {
        setLoadFailed(true);
        return;
      }
      const data = await fetchBingoForEdit(bingoId);
      if (!data) {
        setLoadFailed(true);
        return;
      }

      setGrid(data.grid);
      setMaxEdits(data.maxEdits);
      setTitle(data.title);
      setCells(data.cells);
      setCellIds(data.cellIds);
      setCellOriginalEditCounts(data.cellEditCounts);
      setCellEdits(Array(data.cells.length).fill(0));
      setSelectedTheme(data.theme);
      setVisibility(data.visibility);
    } catch (e) {
      Sentry.captureException(e);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [bingoId]);
  // Effect for initing screen state after server data loading
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void init();
  }, [init]);

  const isDirty = useRef(false);
  const markDirty = () => {
    isDirty.current = true;
  };

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleBack = () => {
    if (isDirty.current) setShowLeaveModal(true);
    else router.back();
  };

  const handleSave = async () => {
    if (!title.trim()) return setAlertMessage(t('home.enterTitle'));
    if (saving) return;
    setSaving(true);
    try {
      const changedCells = cellIds
        .map((id, i) => ({
          id,
          content: cells[i] ?? '',
          newEditCount: cellOriginalEditCounts[i] + (cellEdits[i] ?? 0),
        }))
        .filter((_, i) => (cellEdits[i] ?? 0) > 0);
      await updateBingo(bingoId, title, selectedTheme, changedCells, visibility);
      router.replace('/(tabs)');
    } catch (e) {
      Sentry.captureException(e);
      setAlertMessage(t('home.saveFail'));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const team = await fetchTeamByBoardId(bingoId);

      if (team && !team.isFinished) await leaveTeam(team.teamId);

      if (!team || team.mode !== 'shared') await deleteBingo(bingoId);

      router.replace('/(tabs)');
    } catch (e) {
      Sentry.captureException(e);
      setDeleting(false);
      setShowDeleteModal(false);
      setAlertMessage(t('home.deleteFail'));
    }
  };

  const isUnlimited = maxEdits === 9999 || maxEdits === -1;
  const totalUsedEdits =
    cellEdits.reduce((a, b) => a + b, 0) + cellOriginalEditCounts.reduce((a, b) => a + b, 0);

  const disabledCells = cells.map(() => {
    if (isUnlimited) return false;
    if (maxEdits === 0) return true;
    return totalUsedEdits >= maxEdits;
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Loading />
      </View>
    );
  }

  if (loadFailed) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <PageHeader title={t('home.modifyBingo')} />
        <ErrorState message={t('home.loadFail')} onRetry={() => void init()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader
        onBack={handleBack}
        right={
          <Pressable onPress={() => setShowDeleteModal(true)} hitSlop={8}>
            <DeleteIcon width={24} height={24} className="text-danger" />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: 32, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pb-2 pt-7">
          <Text className="text-title-lg font-pretendard-medium text-gray-900">빙고 수정하기</Text>
        </View>

        <BingoTitle
          value={title}
          onChange={(v) => {
            markDirty();
            setTitle(v);
          }}
        />

        <View style={{ gap: 32 }}>
          <View>
            <View className="px-4">
              <SectionLabel label={t('home.selectTheme')} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
            >
              {themes.map((theme) => (
                <Chip
                  key={theme.id}
                  label={theme.displayName}
                  selected={selectedTheme === theme.id}
                  onPress={() => {
                    markDirty();
                    setSelectedTheme(theme.id);
                  }}
                />
              ))}
            </ScrollView>
          </View>

          <View className="gap-2">
            <Text className="px-4 text-body-sm text-gray-600">
              {t('home.modifyCount')} {totalUsedEdits}/{isUnlimited ? t('home.infinite') : maxEdits}
            </Text>

            <AddEachBingo
              selectedGrid={grid}
              theme={selectedTheme}
              title={title}
              cells={cells}
              disabledCells={disabledCells}
              onCellsChange={(newCells) => {
                markDirty();
                const changedIdx = newCells.findIndex((c, i) => c !== cells[i]);
                if (changedIdx >= 0) {
                  const updated = [...cellEdits];
                  updated[changedIdx] = (updated[changedIdx] ?? 0) + 1;
                  setCellEdits(updated);
                }
                setCells(newCells);
              }}
            />
          </View>
        </View>

        <VisibilitySelector value={visibility} onChange={setVisibility} />

        <View className="px-4">
          <Button
            label={t('home.save')}
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
            className="w-full"
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
        visible={showDeleteModal}
        title={t('home.deleteConfirm')}
        body={t('home.deleteBody')}
        variant="warning"
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        confirmLoading={deleting}
        onCancel={deleting ? undefined : () => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        onDismiss={deleting ? undefined : () => setShowDeleteModal(false)}
      />

      <Modal
        visible={showLeaveModal}
        title={t('home.leaveTitle')}
        body={t('home.leaveBody')}
        cancelLabel={t('home.leaveCancel')}
        confirmLabel={t('home.leaveConfirm')}
        onCancel={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          router.back();
        }}
        onDismiss={() => setShowLeaveModal(false)}
      />
    </View>
  );
}
