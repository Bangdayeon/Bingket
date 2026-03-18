import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import TextInput from '@/components/common/TextInput';
import AddBingo from '@/components/page/bingo-add/AddBingo';
import BingoModifyHeader from '@/components/page/bingo-modify/Header';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_BINGO = {
  title: '빙고 제목입니다. 빙고 제목',
  grid: '3x3',
  cells: Array(9).fill('어쩌구 저쩌구\n이런저런거 하기'),
  maxEdits: 3,
};

export default function BingoModifyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [title, setTitle] = useState(MOCK_BINGO.title);
  const [cells, setCells] = useState<string[]>(MOCK_BINGO.cells);
  const [cellEdits, setCellEdits] = useState<number[]>(Array(MOCK_BINGO.cells.length).fill(0));
  const maxEdits = MOCK_BINGO.maxEdits;

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
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <BingoModifyHeader onBack={handleBack} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View className="px-5 pt-5 pb-8">
          <Text className="text-title-md text-gray-900 mb-2">제목</Text>
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
          <Text className="text-title-md text-gray-900 mb-3">빙고</Text>

          <View className="flex-row items-center mb-1">
            <Text className="text-body-lg text-gray-900">테마</Text>
            <View className="flex-1" />
          </View>
          <Text className="text-caption-md text-gray-900 mb-4">
            기본 그린{'  '}토끼풀{'  '}2026{'  '}고먐미
          </Text>

          <AddBingo
            selectedGrid={MOCK_BINGO.grid}
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
            <Text className="text-body-sm text-gray-500">수정 가능 횟수 </Text>
            <Text className="text-label-sm text-gray-900">
              {cellEdits.reduce((a, b) => a + b, 0)}/
              {maxEdits === -1 ? '무제한' : maxEdits * cells.length}
            </Text>
          </View>

          <Pressable onPress={() => setShowDeleteModal(true)} className="mt-6">
            <Text className="text-body-lg text-red-500">빙고 삭제하기</Text>
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
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-5 bg-white pt-3 border-t border-gray-100"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <Button label="취소하기" variant="secondary" onClick={handleBack} className="flex-1" />
        <Button label="저장하기" variant="primary" onClick={handleSave} className="flex-1" />
      </View>
    </View>
  );
}
