import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager, RefreshControl, ScrollView, Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { startTransition, useState, useCallback, useRef } from 'react';
import { BingoCard } from './components/BingoCard';
import { BingoCellModal } from './BingoCellModal';
import { Text } from '@/components/Text';
import AddIcon from '@/assets/icons/ic_add.svg';
import { BingoData } from '@/types/bingo';
import { BingoCellDetail } from '@/types/bingo-cell';
import {
  fetchMyBingos,
  markBingoDone,
  updateCell,
  calcBingoCount,
} from '@/features/bingo/lib/bingo';
import { fetchMyTeams, notifyTeamCellChecked } from '@/features/team/lib/team';
import type { TeamAvatarMember } from '@/features/team/components/TeamAvatars';
import { supabase } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/cache';
import { MAX_BINGOS } from '@/constants/bingo';
import { CACHE_KEY_ALL } from '@/constants/cache_key';
import Loading from '@/components/Loading';
import { Modal } from '@/components/Modal';

const DRAFT_ID = 'draft_0';

/** 로컬에 임시 저장된 제작 중 빙고를 카드 하나로 변환한다. 없으면 null */
async function loadDraftBingo(): Promise<BingoData | null> {
  try {
    const raw = await AsyncStorage.getItem('@bingket/draft-bingo');
    if (!raw) return null;
    const d = JSON.parse(raw) as {
      title?: string;
      selectedGrid?: string;
      selectedTheme?: string;
      startDate?: string | null;
      endDate?: string | null;
      cells?: string[];
    };
    if (!d.title) return null;

    const grid = d.selectedGrid ?? '3x3';
    const [cols, rows] = grid.split('x').map(Number);
    return {
      id: DRAFT_ID,
      title: d.title,
      grid,
      cells: (d.cells ?? []).slice(0, cols * rows),
      maxEdits: 0,
      achievedCount: 0,
      bingoCount: 0,
      dday: 0,
      startDate: d.startDate ? d.startDate.split('T')[0] : null,
      targetDate: d.endDate ? d.endDate.split('T')[0] : null,
      state: 'draft',
      theme: d.selectedTheme ?? 'default',
      retrospective: null,
    };
  } catch (e) {
    Sentry.captureException(e);
    return null;
  }
}

export function BingoAll() {
  const router = useRouter();
  const [bingos, setBingos] = useState<BingoData[]>([]);
  const [cellDetails, setCellDetails] = useState<Record<string, BingoCellDetail[]>>({});
  /** 빙고판 id → 그 판이 속한 팀 (없으면 개인 빙고) */
  const [teamsByBoard, setTeamsByBoard] = useState<
    Record<
      string,
      | { teamId: string; members: TeamAvatarMember[]; startDate: string; endDate: string }
      | undefined
    >
  >({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<{ bingoId: string; cellIndex: number } | null>(
    null,
  );
  const memoDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isNavigatingRef = useRef(false);

  const loadData = useCallback(() => {
    Promise.all([fetchMyBingos(), loadDraftBingo()]).then(async ([fetched, draft]) => {
      const details: Record<string, BingoCellDetail[]> = {};
      const serverBingos = fetched.map(({ bingo, cellDetails: cd }) => {
        details[bingo.id] = cd;
        return bingo;
      });

      // 종료일이 오늘 이전인 빙고 자동 완료 처리
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiredIds = serverBingos
        .filter((b) => b.targetDate && new Date(b.targetDate) < today)
        .map((b) => b.id);
      if (expiredIds.length > 0) {
        await Promise.all(expiredIds.map((id) => markBingoDone(id).catch(Sentry.captureException)));
      }

      // 만료된 빙고는 BingoAll에서 제외 (마이페이지 피드에서 완료로 표시된다)
      const progressBingos = serverBingos.filter((b) => !expiredIds.includes(b.id));
      // 제작 중인 빙고는 로컬에만 있고 서버에 없다. 맨 앞에 붙여 이어서 만들 수 있게 한다
      const sliced = [...(draft ? [draft] : []), ...progressBingos].slice(0, MAX_BINGOS);
      setBingos(sliced);
      setCellDetails(details);
      setLoading(false);
      setCache(CACHE_KEY_ALL, { bingos: sliced, cellDetails: details });

      // 각 빙고가 팀에 속해 있는지 조회. 종료된 팀은 카드에 표시하지 않는다.
      const [myTeams, { data: auth }] = await Promise.all([
        fetchMyTeams(),
        supabase.auth.getUser(),
      ]);
      const byBoard: typeof teamsByBoard = {};
      for (const team of myTeams) {
        if (team.isInvite || team.isFinished || !team.myBoardId) continue;
        byBoard[team.myBoardId] = {
          teamId: team.teamId,
          members: team.members,
          startDate: team.startDate,
          endDate: team.endDate,
        };
      }
      startTransition(() => {
        setTeamsByBoard(byBoard);
        setCurrentUserId(auth.user?.id ?? null);
      });
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      // 팀 상태는 항상 최신으로 다시 받아야 하므로 포커스 시 초기화
      setTeamsByBoard({});

      // navigation transition 애니메이션 완료 후 데이터 로드 (main thread 블로킹 방지)
      const task = InteractionManager.runAfterInteractions(() => {
        getCache<{ bingos: BingoData[]; cellDetails: Record<string, BingoCellDetail[]> }>(
          CACHE_KEY_ALL,
        ).then((cached) => {
          if (cached) {
            setBingos(cached.bingos);
            setCellDetails(cached.cellDetails);
            setLoading(false);
          }
          loadData();
        });
      });

      return () => task.cancel();
    }, [loadData]),
  );

  // Realtime을 쓰지 않으므로 팀원이 채운 칸은 당겨서 새로고침으로 반영한다
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 600);
  }, [loadData]);

  /** 연타로 화면이 두 번 쌓이는 것을 막는다 */
  const navigateOnce = (pathname: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(pathname);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };

  const handleCellPress = (bingo: BingoData, cellIndex: number) => {
    // 제작 중 빙고는 서버에 셀이 없다. 칸을 누르면 이어서 만들기로 보낸다
    if (bingo.id === DRAFT_ID) {
      router.push({ pathname: '/bingo/add', params: { loadDraft: 'true' } });
      return;
    }
    setModalTarget({ bingoId: bingo.id, cellIndex });
  };

  const handleCellUpdate = (
    cellId: string,
    updates: Partial<Pick<BingoCellDetail, 'completed' | 'completedAt' | 'memo'>>,
  ) => {
    if (!modalTarget) return;
    const { bingoId } = modalTarget;

    const updatedCells = (cellDetails[bingoId] ?? []).map((cell) =>
      cell.id === cellId ? { ...cell, ...updates } : cell,
    );
    setCellDetails((prev) => ({ ...prev, [bingoId]: updatedCells }));

    // 달성/빙고 수 실시간 재계산
    if ('completed' in updates) {
      const bingo = bingos.find((b) => b.id === bingoId);
      if (bingo) {
        const [cols, rows] = bingo.grid.split('x').map(Number);
        const checked = updatedCells.map((c) => c.completed);
        const newAchievedCount = checked.filter(Boolean).length;
        const newBingoCount = calcBingoCount(checked, cols, rows);
        setBingos((prev) =>
          prev.map((b) =>
            b.id === bingoId
              ? { ...b, achievedCount: newAchievedCount, bingoCount: newBingoCount }
              : b,
          ),
        );
      }
    }

    // DB 저장: memo는 디바운스, 나머지는 즉시
    const { memo, ...nonMemoUpdates } = updates;
    if (Object.keys(nonMemoUpdates).length > 0) {
      const isTeamBoard = !!teamsByBoard[bingoId];
      const isChecking = updates.completed === true;

      updateCell(cellId, nonMemoUpdates, {
        // 같이 채우기에서 동시에 누르면 먼저 누른 사람이 이긴다
        onlyIfUnchecked: isTeamBoard && isChecking,
      })
        .then(({ applied }) => {
          if (isTeamBoard && isChecking && !applied) {
            // 내가 늦었다 -- 화면을 실제 상태로 되돌린다
            setConflictMessage('한발 늦었어요! 이미 다른 팀원이 채운 칸이에요.');
            loadData();
            return;
          }
          if (!isChecking || !isTeamBoard) return;
          const cell = updatedCells.find((c) => c.id === cellId);
          return notifyTeamCellChecked(bingoId, cell?.title ?? '');
        })
        .catch(Sentry.captureException);
    }
    if (memo !== undefined) {
      clearTimeout(memoDebounceRef.current[cellId]);
      memoDebounceRef.current[cellId] = setTimeout(() => {
        updateCell(cellId, { memo }).catch(Sentry.captureException);
      }, 500);
    }
  };

  const modalCells = modalTarget ? (cellDetails[modalTarget.bingoId] ?? []) : [];
  const modalTeam = modalTarget ? teamsByBoard[modalTarget.bingoId] : undefined;

  if (loading) {
    return (
      <View className="flex-1 mt-[50px] items-center justify-center bg-white  ">
        <Loading color="#6ADE50" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 mt-[60px]  "
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6ADE50" />
      }
    >
      {bingos.map((bingo) => (
        <BingoCard
          key={bingo.id}
          bingo={bingo}
          completedCells={cellDetails[bingo.id]?.map((c) => c.completed)}
          onCellPress={(cellIndex) => handleCellPress(bingo, cellIndex)}
          onEditPress={() =>
            bingo.id === DRAFT_ID
              ? router.push({ pathname: '/bingo/add', params: { loadDraft: 'true' } })
              : router.push({ pathname: '/bingo/modify', params: { bingoId: bingo.id } })
          }
          teamMembers={teamsByBoard[bingo.id]?.members}
          onTeamPress={() => {
            const teamId = teamsByBoard[bingo.id]?.teamId;
            if (teamId) {
              router.push({ pathname: '/bingo/team-status', params: { teamId } });
            }
          }}
        />
      ))}
      {bingos.length === 0 && (
        <View className="flex items-center mt-32">
          <Text className="text-title-md ">아직 빙고가 없어요</Text>
          <Text className="text-title-md">첫 빙고를 추가해볼까요?</Text>
        </View>
      )}

      {/* 새 빙고 추가 섹션: 혼자 할지 함께 할지 먼저 고른다 */}
      {bingos.length < MAX_BINGOS && (
        <View className="px-5 mt-10">
          <View className="items-center justify-center gap-4 bg-green-100 w-full rounded-[20px] py-8 px-5">
            <AddIcon width={40} height={40} color="#4C5252" /* gray-700 */ />
            <Text
              className="text-title-md font-pretendard-medium"
              style={{ color: '#4C5252' /* gray-700 */ }}
            >
              새 빙고 만들기
            </Text>
            <Text className="text-title-md" style={{ color: '#4C5252' /* gray-700 */ }}>
              ({bingos.length}/{MAX_BINGOS})
            </Text>

            <View className="w-full gap-3 mt-2">
              <Pressable
                onPress={() => navigateOnce('/bingo/add')}
                className="bg-white rounded-2xl px-5 py-4 gap-1"
              >
                <Text className="text-title-sm font-pretendard-semibold">나만의 빙고</Text>
                <Text className="text-body-sm" style={{ color: '#4C5252' /* gray-700 */ }}>
                  혼자 세운 목표를 내 속도로 채워요
                </Text>
              </Pressable>

              <Pressable
                onPress={() => navigateOnce('/bingo/team-mode')}
                className="bg-white rounded-2xl px-5 py-4 gap-1"
              >
                <Text className="text-title-sm font-pretendard-semibold">친구와 같이하기</Text>
                <Text className="text-body-sm" style={{ color: '#4C5252' /* gray-700 */ }}>
                  친구를 초대해 같은 기간 동안 함께 채워요
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      <View className="h-24" />

      <BingoCellModal
        visible={!!modalTarget}
        cells={modalCells}
        initialIndex={modalTarget?.cellIndex ?? 0}
        onClose={() => setModalTarget(null)}
        onUpdate={handleCellUpdate}
        team={
          modalTeam && currentUserId
            ? {
                currentUserId,
                members: modalTeam.members,
                startDate: modalTeam.startDate,
                endDate: modalTeam.endDate,
              }
            : undefined
        }
      />

      <Modal
        visible={!!conflictMessage}
        title="이미 채워진 칸이에요"
        body={conflictMessage ?? ''}
        variant="single"
        confirmLabel="확인"
        onConfirm={() => setConflictMessage(null)}
        onDismiss={() => setConflictMessage(null)}
      />
    </ScrollView>
  );
}
