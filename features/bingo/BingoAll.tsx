import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { startTransition, useState, useCallback, useRef } from 'react';
import { BingoCard } from './components/BingoCard';
import { BingoCellModal, type MemoSaveState } from './BingoCellModal';
import { Text } from '@/components/Text';
import { BingoData } from '@/types/bingo';
import { BingoCellDetail } from '@/types/bingo-cell';
import {
  fetchMyBingos,
  markBingoDone,
  updateCell,
  calcBingoCount,
} from '@/features/bingo/lib/bingo';
import {
  acceptTeamInvite,
  fetchJoinedSharedBoards,
  fetchTeamInvite,
  rejectTeamInvite,
  fetchMyTeams,
} from '@/features/team/lib/team';
import type { TeamAvatarMember } from '@/features/team/components/TeamAvatars';
import { supabase } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/cache';
import { MAX_BINGOS } from '@/constants/bingo';
import { CACHE_KEY_ALL } from '@/constants/cache_key';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import { Modal } from '@/components/Modal';
import {
  deleteNotificationByTarget,
  fetchNotifications,
  type Notification,
} from '@/features/notifications/lib/notifications';
import { NotificationStrip } from '@/features/notifications/components/NotificationStrip';
import { useUnreadNotifications } from '@/features/notifications/unread-context';

const DRAFT_ID = 'draft_0';

/** 홈 상단 스트립에 띄우는 알림 타입 */
const STRIP_TYPES = new Set(['team_invite', 'team_invite_declined']);

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

/** 빈 화면과 추가 카드 양쪽에서 쓰는 만들기 버튼 한 쌍 */
function CreateBingoButtons({ onCreate }: { onCreate: (pathname: string) => void }) {
  return (
    <View className="w-full gap-3">
      <Button label="혼자 할래요" onClick={() => onCreate('/bingo/add')} className="w-full" />
      <Button
        label="지인과 할래요"
        variant="secondary"
        onClick={() => onCreate('/bingo/team-mode')}
        className="w-full"
      />
    </View>
  );
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
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<{ bingoId: string; cellIndex: number } | null>(
    null,
  );
  const memoDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  /** 아직 서버에 못 보낸 메모. 닫을 때 밀어넣고, 실패하면 여기 남는다 */
  const pendingMemoRef = useRef<Record<string, string>>({});
  const [memoSaveState, setMemoSaveState] = useState<Record<string, MemoSaveState | undefined>>({});
  const isNavigatingRef = useRef(false);
  const [stripNotifications, setStripNotifications] = useState<Notification[]>([]);
  const [stripPendingId, setStripPendingId] = useState<string | null>(null);
  const { refresh: refreshUnread } = useUnreadNotifications();

  const loadData = useCallback(() => {
    Promise.all([fetchMyBingos(), fetchJoinedSharedBoards(), loadDraftBingo()]).then(
      async ([fetched, sharedFetched, draft]) => {
        const details: Record<string, BingoCellDetail[]> = {};
        const collect = ({ bingo, cellDetails: cd }: (typeof fetched)[number]) => {
          details[bingo.id] = cd;
          return bingo;
        };
        const serverBingos = fetched.map(collect);
        // 방장이 아니라서 내 소유가 아닌 공유판. 칸만 채울 수 있다
        const guestBingos = sharedFetched.map(collect);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isExpired = (b: BingoData) => !!b.targetDate && new Date(b.targetDate) < today;

        // 종료일이 오늘 이전인 빙고 자동 완료 처리.
        // 남의 공유판은 방장만 완료 처리할 수 있으므로 목록에서 빼기만 한다.
        const expiredIds = serverBingos.filter(isExpired).map((b) => b.id);
        if (expiredIds.length > 0) {
          await Promise.all(
            expiredIds.map((id) => markBingoDone(id).catch(Sentry.captureException)),
          );
        }

        // 만료된 빙고는 BingoAll에서 제외 (마이페이지 피드에서 완료로 표시된다)
        const progressBingos = serverBingos.filter((b) => !expiredIds.includes(b.id));
        // 제작 중인 빙고는 로컬에만 있고 서버에 없다. 맨 앞에 붙여 이어서 만들 수 있게 한다
        // 개수 제한은 내가 만든 판에만 적용된다. 남의 공유판은 뒤에 덧붙인다.
        const sliced = [
          ...[...(draft ? [draft] : []), ...progressBingos].slice(0, MAX_BINGOS),
          ...guestBingos.filter((b) => !isExpired(b)),
        ];
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
      },
    );
  }, []);

  /**
   * 홈 상단 스트립에 띄울 알림. 캐시를 태우지 않는다 — 알림 페이지에서 먼저 처리한
   * 초대가 3분 stale 창에 걸려 홈에 남아 있으면 안 된다.
   */
  const loadStripNotifications = useCallback(() => {
    fetchNotifications()
      .then((all) => setStripNotifications(all.filter((n) => STRIP_TYPES.has(n.type))))
      .catch(Sentry.captureException);
  }, []);

  useFocusEffect(
    useCallback(() => {
      // 팀 상태는 항상 최신으로 다시 받아야 하므로 포커스 시 초기화
      setTeamsByBoard({});
      loadStripNotifications();

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
    }, [loadData, loadStripNotifications]),
  );

  // Realtime을 쓰지 않으므로 팀원이 채운 칸은 당겨서 새로고침으로 반영한다
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 600);
  }, [loadData]);

  /** 연타로 화면이 두 번 쌓이는 것을 막는다 */
  const navigateOnce = (href: Parameters<typeof router.push>[0]) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(href);
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

    const previousCells = cellDetails[bingoId] ?? [];
    const updatedCells = previousCells.map((cell) =>
      cell.id === cellId ? { ...cell, ...updates } : cell,
    );

    /** 화면(칸 + 달성/빙고 수)을 주어진 칸 상태로 맞춘다 */
    const applyCells = (cells: BingoCellDetail[]) => {
      setCellDetails((prev) => ({ ...prev, [bingoId]: cells }));
      if (!('completed' in updates)) return;
      const bingo = bingos.find((b) => b.id === bingoId);
      if (!bingo) return;
      const [cols, rows] = bingo.grid.split('x').map(Number);
      const checked = cells.map((c) => c.completed);
      const newAchievedCount = checked.filter(Boolean).length;
      const newBingoCount = calcBingoCount(checked, cols, rows);
      setBingos((prev) =>
        prev.map((b) =>
          b.id === bingoId
            ? { ...b, achievedCount: newAchievedCount, bingoCount: newBingoCount }
            : b,
        ),
      );
    };

    applyCells(updatedCells);

    /**
     * 저장이 끝내 실패하면 화면만 채워진 채로 남아 다음 새로고침에 되돌아간다.
     * 그 전에 알려주고, 칸 체크는 저장 전 상태로 되돌린다.
     */
    const handleSaveFailure = (error: unknown, rollback: boolean) => {
      Sentry.captureException(error);
      if (rollback) applyCells(previousCells);
      setNotice({
        title: '저장하지 못했어요',
        body: '네트워크 연결이 불안정해요. 연결을 확인한 뒤 다시 시도해 주세요.',
      });
    };

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
            setNotice({
              title: '이미 채워진 칸이에요',
              body: '한발 늦었어요! 이미 다른 팀원이 채운 칸이에요.',
            });
            loadData();
            return;
          }
          // 팀원에게 가는 칸 체크 알림은 bingo_cells UPDATE 트리거
          // (notify_on_team_cell_checked)가 만든다
        })
        .catch((error) => handleSaveFailure(error, true));
    }
    if (memo !== undefined) {
      clearTimeout(memoDebounceRef.current[cellId]);
      pendingMemoRef.current[cellId] = memo;
      setMemoSaveState((prev) => ({ ...prev, [cellId]: 'saving' }));
      memoDebounceRef.current[cellId] = setTimeout(() => saveMemo(cellId), 500);
    }
  };

  /** 메모는 입력 중일 수 있어 실패해도 되돌리지 않고 알리기만 한다 */
  const saveMemo = (cellId: string) => {
    const memo = pendingMemoRef.current[cellId];
    if (memo === undefined) return;
    delete pendingMemoRef.current[cellId];
    updateCell(cellId, { memo })
      .then(() => setMemoSaveState((prev) => ({ ...prev, [cellId]: 'saved' })))
      .catch((error) => {
        // 실패한 텍스트를 되살릴 수 있게 다시 대기열에 넣는다
        pendingMemoRef.current[cellId] = memo;
        setMemoSaveState((prev) => ({ ...prev, [cellId]: 'error' }));
        // 칸 체크와 달리 메모는 되돌리지 않는다. 입력 중일 수 있어서다.
        Sentry.captureException(error);
        setNotice({
          title: '저장하지 못했어요',
          body: '네트워크 연결이 불안정해요. 연결을 확인한 뒤 다시 시도해 주세요.',
        });
      });
  };

  /**
   * 대기 중인 메모를 즉시 저장한다. 모달을 닫는 순간 500ms를 더 기다릴 이유가 없고,
   * 그 사이 화면을 떠나면 저장 결과를 받을 곳이 없어진다.
   */
  const flushPendingMemos = () => {
    for (const cellId of Object.keys(pendingMemoRef.current)) {
      clearTimeout(memoDebounceRef.current[cellId]);
      saveMemo(cellId);
    }
  };

  // 개수 제한은 내가 만든 판만 센다. 남의 공유판은 내 몫을 쓰지 않는다.
  const myBingoCount = bingos.filter((b) => !b.isGuestSharedBoard).length;
  const atBingoCap = myBingoCount >= MAX_BINGOS;

  /** 스트립에서 지우고 화면에서도 즉시 뺀다. loadData는 쿼리가 깊어 느리다 */
  const dismissStrip = (item: Notification) => {
    setStripNotifications((prev) => prev.filter((n) => n.id !== item.id));
    // 알림이 하나 사라졌으니 하단 탭의 빨간 점도 다시 센다
    refreshUnread();
  };

  const handleStripAccept = async (item: Notification) => {
    if (!item.target_id) return;
    if (atBingoCap) {
      setNotice({
        title: '빙고를 먼저 정리해주세요',
        body: `빙고는 한 번에 ${MAX_BINGOS}개까지 진행할 수 있어요. 진행 중인 빙고를 마치면 함께할 수 있어요.`,
      });
      return;
    }
    // 다른 목표로(own)는 내 빙고를 직접 만들어야 해서 여기서 바로 수락할 수 없다
    if (item.teamMode === 'own') {
      navigateOnce({ pathname: '/bingo/team-invite', params: { teamId: item.target_id } });
      return;
    }

    setStripPendingId(item.id);
    try {
      const invite = await fetchTeamInvite(item.target_id);
      if (!invite) throw new Error('초대를 찾을 수 없어요.');
      await acceptTeamInvite({
        teamId: item.target_id,
        // 같은 목표로(copied)는 방장 빙고를 그대로 복제한다
        board:
          invite.mode === 'copied' && invite.ownerBoard
            ? {
                title: invite.ownerBoard.title,
                grid: invite.ownerBoard.grid,
                theme: invite.ownerBoard.theme,
                editCount: String(invite.ownerBoardMaxEdits),
                cells: invite.ownerBoard.cells,
              }
            : undefined,
      });
      dismissStrip(item);
      loadData();
    } catch (e) {
      Sentry.captureException(e);
      setNotice({ title: '수락하지 못했어요', body: '잠시 후 다시 시도해 주세요.' });
    } finally {
      setStripPendingId(null);
    }
  };

  const handleStripDecline = async (item: Notification) => {
    if (!item.target_id) return;
    setStripPendingId(item.id);
    try {
      await rejectTeamInvite(item.target_id);
      dismissStrip(item);
    } catch (e) {
      Sentry.captureException(e);
      setNotice({ title: '거절하지 못했어요', body: '잠시 후 다시 시도해 주세요.' });
    } finally {
      setStripPendingId(null);
    }
  };

  const handleStripConfirm = async (item: Notification) => {
    if (!item.target_id) return;
    dismissStrip(item);
    await deleteNotificationByTarget(item.type, item.target_id).catch(Sentry.captureException);
  };
  const modalCells = modalTarget ? (cellDetails[modalTarget.bingoId] ?? []) : [];
  const modalTeam = modalTarget ? teamsByBoard[modalTarget.bingoId] : undefined;

  /** 스트립은 스크롤과 함께 밀려나지 않도록 목록 밖 최상단에 둔다 */
  const strip = (
    <NotificationStrip
      items={stripNotifications}
      pendingId={stripPendingId}
      atBingoCap={atBingoCap}
      onAccept={handleStripAccept}
      onDecline={handleStripDecline}
      onConfirm={handleStripConfirm}
    />
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white  ">
        {strip}
        <View className="flex-1 items-center justify-center">
          <Loading color="#6ADE50" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {strip}
      <ScrollView
        className="flex-1"
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
            // 남의 공유판은 제목·내용을 방장만 고칠 수 있으므로 수정 진입을 감춘다
            onEditPress={
              bingo.isGuestSharedBoard
                ? undefined
                : () =>
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
        {/* 빙고가 하나도 없을 때: 화면 가운데 안내 + 만들기 버튼 */}
        {bingos.length === 0 && (
          <View className="items-center px-5 mt-40">
            <Text className="text-body-md" style={{ color: '#4C5252' /* gray-700 */ }}>
              빙고가 하나도 없어요
            </Text>
            <Text className="text-body-md mb-8" style={{ color: '#4C5252' /* gray-700 */ }}>
              첫 빙고를 만들어 볼까요?
            </Text>
            <CreateBingoButtons onCreate={navigateOnce} />
          </View>
        )}

        {/* 빙고가 있을 때: 목록 아래에 추가 카드, 상한에 닿으면 안내 문구 */}
        {bingos.length > 0 &&
          (myBingoCount < MAX_BINGOS ? (
            <View className="px-5 mt-6">
              <View className="items-center bg-white   rounded-[20px] py-6 px-5">
                <Text className="text-body-md mb-5" style={{ color: '#181C1C' /* gray-900 */ }}>
                  빙고 추가하기 ({myBingoCount}/{MAX_BINGOS})
                </Text>
                <CreateBingoButtons onCreate={navigateOnce} />
              </View>
            </View>
          ) : (
            <View className="items-center px-5 mt-10">
              <Text className="text-body-md" style={{ color: '#929898' /* gray-500 */ }}>
                빙고는 한 번에 {MAX_BINGOS}개까지 진행할 수 있어요
              </Text>
            </View>
          ))}
        <View className="h-24" />

        <BingoCellModal
          visible={!!modalTarget}
          cells={modalCells}
          initialIndex={modalTarget?.cellIndex ?? 0}
          onClose={() => {
            flushPendingMemos();
            setModalTarget(null);
          }}
          onUpdate={handleCellUpdate}
          memoSaveState={memoSaveState}
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
          visible={!!notice}
          title={notice?.title ?? ''}
          body={notice?.body ?? ''}
          variant="single"
          confirmLabel="확인"
          onConfirm={() => setNotice(null)}
          onDismiss={() => setNotice(null)}
        />
      </ScrollView>
    </View>
  );
}
