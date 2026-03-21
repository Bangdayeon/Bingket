import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { TextInput } from '@/components/TextInput';
import { AddEachBingo } from '@/features/bingo/bingo-add/AddEachBingo';
import { BingoModifyHeader } from '@/features/bingo/bingo-modify/Header';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_BINGOS } from '@/mocks/bingo';

export default function BingoModifyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bingoId } = useLocalSearchParams<{ bingoId: string }>();

  const bingo = MOCK_BINGOS.find((b) => b.id === bingoId) ?? MOCK_BINGOS[0];

  const [title, setTitle] = useState(bingo.title);
  const [cells, setCells] = useState<string[]>(bingo.cells);
  const [cellEdits, setCellEdits] = useState<number[]>(Array(bingo.cells.length).fill(0));
  const maxEdits = bingo.maxEdits;

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

  const handleSave = () => {
    if (!title.trim()) return setAlertMessage('제목을 입력해주세요.');
    // TODO: API 호출
    router.replace('/(tabs)');
  };

  const handleDelete = () => {
    // TODO: API 호출 후 홈으로 이동
    router.replace('/(tabs)');
  };

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
          <Text className="text-caption-md mb-4">
            기본 그린{'  '}토끼풀{'  '}2026{'  '}고먐미
          </Text>

          <AddEachBingo
            selectedGrid={bingo.grid}
            cells={cells}
            onCellsChange={(newCells) => {
              markDirty();
              const prev = cells;
              const changedIdx = newCells.findIndex((c, i) => c !== prev[i]);
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
              {cellEdits.reduce((a, b) => a + b, 0)}/
              {maxEdits === -1 ? '무제한' : maxEdits * cells.length}
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
