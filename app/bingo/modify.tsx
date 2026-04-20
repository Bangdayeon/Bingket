import * as Sentry from '@sentry/react-native';
import Button from '@/components/Button';
import { Modal } from '@/components/Modal';
import { BingoEditHeader } from '@/features/bingo/bingo-edit/Header';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { AddEachBingo } from '@/features/bingo/bingo-edit/AddEachBingo';
import { fetchBingoForEdit, updateBingo, deleteBingo } from '@/features/bingo/lib/bingo';
import { fetchBattleByBoardId, quitBattle } from '@/features/battle/lib/battle';
import { fetchThemes } from '@/features/bingo/lib/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import Loading from '@/components/Loading';

export default function BingoModifyScreen() {
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
  const [themes, setThemes] = useState<{ id: string; displayName: string }[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const themeMap = await fetchThemes();
        const uniqueThemes = Object.values(themeMap).filter(
          (v, i, arr) => arr.findIndex((t) => t.id === v.id) === i,
        );
        setThemes(uniqueThemes.map((t) => ({ id: t.id, displayName: t.displayName })));

        if (!bingoId) return;
        const data = await fetchBingoForEdit(bingoId);
        if (!data) {
          router.back();
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
        setLoading(false);
      } catch (e) {
        Sentry.captureException(e);
        router.back();
      }
    };
    init();
  }, [bingoId]);

  const isDirty = useRef(false);
  const markDirty = () => {
    isDirty.current = true;
  };

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleBack = () => {
    if (isDirty.current) setShowLeaveModal(true);
    else router.back();
  };

  const handleSave = async () => {
    if (!title.trim()) return setAlertMessage('제목을 입력해주세요.');
    try {
      const changedCells = cellIds
        .map((id, i) => ({
          id,
          content: cells[i] ?? '',
          newEditCount: cellOriginalEditCounts[i] + (cellEdits[i] ?? 0),
        }))
        .filter((_, i) => (cellEdits[i] ?? 0) > 0);
      await updateBingo(bingoId, title, selectedTheme, changedCells);
      router.replace('/(tabs)');
    } catch (e) {
      Sentry.captureException(e);
      setAlertMessage('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleDelete = async () => {
    try {
      const battle = await fetchBattleByBoardId(bingoId);
      if (battle) await quitBattle(battle.battleId);
      await deleteBingo(bingoId);
      router.replace('/(tabs)');
    } catch (e) {
      Sentry.captureException(e);
      setShowDeleteModal(false);
      setAlertMessage('삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
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
      <View className="flex-1 items-center justify-center bg-white  ">
        <Loading color="#6ADE50" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white  " style={{ paddingTop: insets.top }}>
      <BingoEditHeader title="빙고 수정하기" onBack={handleBack} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <BingoTitle
          value={title}
          onChange={(v) => {
            markDirty();
            setTitle(v);
          }}
        />

        <View className="px-5 py-6">
          <Text className="text-title-md mb-4">빙고 수정</Text>

          <Text className="text-title-sm mb-3">테마</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
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

          <Text className="text-title-sm mb-2">빙고 내용 수정하기</Text>
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

          <View className="flex-row justify-end items-center mt-3">
            <Text className="text-body-sm text-gray-500  ">수정 가능 횟수 </Text>
            {isUnlimited ? (
              <Image
                source={require('@/assets/icons/infinite.png')}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            ) : (
              <Text className="text-label-sm">
                {totalUsedEdits}/{maxEdits}
              </Text>
            )}
          </View>

          <Pressable onPress={() => setShowDeleteModal(true)} className="mt-6">
            <Text className="text-body-md" style={{ color: '#E02828' /* red */ }}>
              빙고 삭제하기
            </Text>
          </Pressable>
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
        visible={showDeleteModal}
        title="빙고를 정말로 삭제하시나요?"
        body="삭제된 빙고는 되돌릴 수 없어요."
        variant="warning"
        cancelLabel="취소하기"
        confirmLabel="삭제하기"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        onDismiss={() => setShowDeleteModal(false)}
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

      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-5 bg-white   pt-3 border-t border-gray-100  "
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <Button label="취소하기" variant="secondary" onClick={handleBack} className="flex-1" />
        <Button label="저장하기" variant="primary" onClick={handleSave} className="flex-1" />
      </View>
    </View>
  );
}
