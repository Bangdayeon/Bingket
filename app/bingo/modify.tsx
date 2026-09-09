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

      // bingoId 없이 들어오거나 판을 못 찾으면, 예전에는 로딩 해제도 안 하고
      // 말없이 뒤로 튕겼다. 이유를 보여주고 돌아갈 수단을 남긴다.
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

  useEffect(() => {
    void init();
  }, [init]);

  const isDirty = useRef(false);
  const markDirty = () => {
    isDirty.current = true;
  };

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // 저장·삭제 모두 네트워크 왕복이 있고, 삭제는 최대 3번이다(팀 조회 → 탈퇴 → 삭제).
  // 표시가 없으면 사용자는 눌린 줄 모르고 다시 누른다.
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleBack = () => {
    if (isDirty.current) setShowLeaveModal(true);
    else router.back();
  };

  const handleSave = async () => {
    if (!title.trim()) return setAlertMessage('제목을 입력해주세요.');
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
      setAlertMessage('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      setSaving(false);
    }
    // 성공하면 router.replace로 화면이 통째로 바뀌므로 해제하지 않는다.
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const team = await fetchTeamByBoardId(bingoId);

      // 진행 중인 팀에 속한 판이면 먼저 팀에서 빠진다.
      // 종료된 팀은 다른 사람의 기록이기도 하므로 건드리지 않는다.
      if (team && !team.isFinished) await leaveTeam(team.teamId);

      // 같이 채우기 판은 팀 공용이라 나 혼자 지울 수 없다 -- 팀에서 나가는 것으로 끝낸다
      if (!team || team.mode !== 'shared') await deleteBingo(bingoId);

      router.replace('/(tabs)');
    } catch (e) {
      Sentry.captureException(e);
      setDeleting(false);
      setShowDeleteModal(false);
      setAlertMessage('삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
    // 성공 경로는 router.replace로 화면이 사라지므로 해제하지 않는다.
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
        <PageHeader title="빙고 수정하기" />
        <ErrorState message="빙고를 불러오지 못했어요" onRetry={() => void init()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* 뒤로가기 줄만 고정한다. 제목과 저장 버튼은 내용과 함께 스크롤된다. */}
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
        // 섹션 간격은 여기 한 곳에서 준다. 섹션마다 자기 패딩을 들면 제각각이 된다.
        contentContainerStyle={{ gap: 32, paddingBottom: insets.bottom + 32 }}
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

        <View className="gap-8">
          <View>
            <View className="px-4">
              <SectionLabel label="테마 선택" />
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

          {/* 수정 횟수는 판에 대한 설명이라 판과 한 덩어리로 둔다.
              바깥 gap-8을 그대로 받으면 판에서 32px 떨어져 따로 노는 줄로 보인다. */}
          <View className="gap-2">
            {/* 시안: 남은 수정 횟수는 판 위, 좌측 정렬 */}
            <Text className="px-4 text-body-sm text-gray-600">
              빙고 수정 가능 횟수 {totalUsedEdits}/{isUnlimited ? '무제한' : maxEdits}
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

        {/* 저장 버튼도 고정하지 않는다 — 화면이 짧아 보이고 스크롤 영역을 먹는다. */}
        <View className="px-4">
          <Button
            label="저장하기"
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
        confirmLabel="확인"
        onConfirm={() => setAlertMessage(null)}
      />

      <Modal
        visible={showDeleteModal}
        title="빙고를 정말로 삭제할까요?"
        body="삭제된 빙고는 되돌릴 수 없어요."
        variant="warning"
        cancelLabel="취소"
        confirmLabel="삭제"
        confirmLoading={deleting}
        // 삭제가 도는 중에 모달이 닫히면 사용자는 끝난 줄 알고 화면을 떠난다.
        onCancel={deleting ? undefined : () => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        onDismiss={deleting ? undefined : () => setShowDeleteModal(false)}
      />

      <Modal
        visible={showLeaveModal}
        title="저장하지 않은 변경사항이 있어요"
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
    </View>
  );
}
