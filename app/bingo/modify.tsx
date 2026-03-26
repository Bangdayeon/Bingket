import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { TextInput } from '@/components/TextInput';
import { AddEachBingo } from '@/features/bingo/bingo-add/AddEachBingo';
import { BingoModifyHeader } from '@/features/bingo/bingo-modify/Header';
import { fetchBingoForEdit, updateBingo, deleteBingo } from '@/features/bingo/lib/bingo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';

const THEMES = ['기본', '토끼', '붉은말', '고먐미'];
const THEME_TO_DISPLAY: Record<string, string> = {
  default: '기본',
  rabbit: '토끼',
  red_horse: '붉은말',
  square_cat: '고먐미',
};

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
  const [selectedTheme, setSelectedTheme] = useState('기본');

  useEffect(() => {
    if (!bingoId) return;
    fetchBingoForEdit(bingoId).then((data) => {
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
      setSelectedTheme(THEME_TO_DISPLAY[data.theme] ?? '기본');
      setLoading(false);
    });
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
      console.error('[updateBingo] 오류:', e);
      setAlertMessage('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBingo(bingoId);
      router.replace('/(tabs)');
    } catch (e) {
      console.error('[deleteBingo] 오류:', e);
      setShowDeleteModal(false);
      setAlertMessage('삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const disabledCells = cells.map((_, i) => {
    if (maxEdits === -1) return false;
    if (maxEdits === 0) return true;
    return (cellOriginalEditCounts[i] ?? 0) + (cellEdits[i] ?? 0) >= maxEdits;
  });

  const totalUsedEdits =
    cellEdits.reduce((a, b) => a + b, 0) + cellOriginalEditCounts.reduce((a, b) => a + b, 0);
  const totalMaxEdits = maxEdits === -1 ? -1 : maxEdits * cells.length;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      <BingoModifyHeader onBack={handleBack} />

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

        <View className="px-5 pt-2 pb-5">
          <Text className="text-title-md mb-3">빙고</Text>

          <View className="flex-row items-center mb-1">
            <Text className="text-body-lg">테마</Text>
            <View className="flex-1" />
          </View>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {THEMES.map((theme) => (
              <Chip
                key={theme}
                label={theme}
                selected={selectedTheme === theme}
                onPress={() => {
                  markDirty();
                  setSelectedTheme(theme);
                }}
              />
            ))}
          </View>

          <AddEachBingo
            selectedGrid={grid}
            theme={selectedTheme}
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

          <View className="flex-row justify-end mt-3">
            <Text className="text-body-sm text-gray-500 dark:text-gray-400">수정 가능 횟수 </Text>
            <Text className="text-label-sm">
              {totalUsedEdits}/{totalMaxEdits === -1 ? '무제한' : totalMaxEdits}
            </Text>
          </View>

          <Pressable onPress={() => setShowDeleteModal(true)} className="mt-6">
            <Text className="text-body-lg" style={{ color: '#E02828' /* red-500 */ }}>
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
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-5 bg-white dark:bg-gray-900 pt-3 border-t border-gray-100 dark:border-gray-800"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <Button label="취소하기" variant="secondary" onClick={handleBack} className="flex-1" />
        <Button label="저장하기" variant="primary" onClick={handleSave} className="flex-1" />
      </View>
    </View>
  );
}
