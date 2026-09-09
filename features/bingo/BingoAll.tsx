import * as Sentry from '@sentry/react-native';
import { useColors } from '@/lib/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, InteractionManager, RefreshControl, ScrollView, View } from 'react-native';
import { CoachMarkTarget } from '@/features/coachmark/CoachMarkTarget';
import { useCoachMarkScrollIntoView } from '@/features/coachmark/use-coach-mark-scroll';
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
  acceptErrorMessage,
  acceptTeamInvite,
  isDeadInvite,
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
import { ErrorState } from '@/components/ErrorState';
import { fetchFriendCount } from '@/features/friend/lib/friend';
import { useOnlineRestore } from '@/lib/use-online';
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

/** '저장됨' 표시를 띄워 두는 시간 */
const MEMO_SAVED_BADGE_MS = 2000;

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
/**
 * 친구가 없으면 '친구와 할래요'를 아예 안 띄운다 — 눌러도 고를 사람이 없다.
 * 그때는 선택지가 하나뿐이므로 '혼자 할래요'라는 대비 문구도 의미가 없어
 * '빙고 추가하기'로 바꾼다.
 */
function CreateBingoButtons({
  onCreate,
  hasFriends,
}: {
  onCreate: (pathname: string) => void;
  hasFriends: boolean;
}) {
  return (
    <View className="w-full max-w-[282px] gap-4 self-center">
      {/*
        첫 실행 안내가 가리키는 버튼. 빈 화면과 목록 아래 두 곳에서 쓰이지만 두 분기가
        배타적이라 같은 id가 동시에 두 번 뜨지 않는다.
        「친구와 할래요」까지 함께 감싸지 않는 이유: 안내 4단계는 구멍으로 터치를
        통과시키는데, 그 버튼을 누르면 /bingo/team-mode로 빠져 투어가 멎는다.
        이 버튼은 라벨이 바뀌어도 목적지가 늘 /bingo/add다.
      */}
      <CoachMarkTarget id="home-create-bingo" className="w-full">
        <Button
          label={hasFriends ? '혼자 할래요' : '빙고 추가하기'}
          size="md"
          onClick={() => onCreate('/bingo/add')}
          className="w-full"
        />
      </CoachMarkTarget>
      {hasFriends && (
        <Button
          label="친구와 할래요"
          variant="secondary"
          size="md"
          onClick={() => onCreate('/bingo/team-mode')}
          className="w-full"
        />
      )}
    </View>
  );
}

export function BingoAll() {
  const colors = useColors();
  const router = useRouter();
  const [bingos, setBingos] = useState<BingoData[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  // 빙고가 이미 있으면 추가 버튼이 목록 맨 아래라, 안내 4단계에서 끌어와야 한다.
  const coachScroll = useCoachMarkScrollIntoView(scrollRef, { 'home-create-bingo': 'end' });
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [hasFriends, setHasFriends] = useState(false);
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
    // .catch가 없으면 조회 실패 시 setLoading(false)에 영영 도달하지 못해
    // 홈 화면이 스피너로 굳는다. 해제는 finally에서 한다.
    Promise.all([fetchMyBingos(), fetchJoinedSharedBoards(), loadDraftBingo(), fetchFriendCount()])
      .then(async ([fetched, sharedFetched, draft, friendCount]) => {
        setHasFriends(friendCount > 0);
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
        // slice는 화면 보호용이다. 남의 공유판은 이미 참여한 것이라 잘라내면 접근할 길이
        // 없어지므로 개수와 무관하게 뒤에 덧붙인다.
        const sliced = [
          ...[...(draft ? [draft] : []), ...progressBingos].slice(0, MAX_BINGOS),
          ...guestBingos.filter((b) => !isExpired(b)),
        ];
        setBingos(sliced);
        setCellDetails(details);
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
        setLoadFailed(false);
      })
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // 오프라인 배너가 "연결되면 자동으로 새로고침돼요"라고 알린다. 실제로 그렇게 한다.
  useOnlineRestore(() => {
    if (loadFailed) loadData();
  });

  /**
   * 홈 상단 스트립에 띄울 알림. 캐시를 태우지 않는다 — 알림 페이지에서 먼저 처리한
   * 초대가 3분 stale 창에 걸려 홈에 남아 있으면 안 된다.
   */
  const loadStripNotifications = useCallback(() => {
    // 스트립은 최근 알림 중 초대류만 걸러 쓰므로, 기본 페이지보다 넓게 본다.
    fetchNotifications(50)
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
          // 팀원에게 가는 칸 체크 알림은 bingo_cells 의 trg_notify_team_cell_checked 가 만든다
          if (isTeamBoard && isChecking && !applied) {
            // 내가 늦었다 -- 화면을 실제 상태로 되돌린다
            setNotice({
              title: '이미 채워진 칸이에요',
              body: '한발 늦었어요! 이미 다른 팀원이 채운 칸이에요.',
            });
            loadData();
          }
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
      .then(() => {
        setMemoSaveState((prev) => ({ ...prev, [cellId]: 'saved' }));
        // 표시를 지워주지 않으면 "저장됨"이 세션 내내 붙어 있어 방금 저장한 것처럼 보인다.
        setTimeout(
          () => setMemoSaveState((prev) => ({ ...prev, [cellId]: undefined })),
          MEMO_SAVED_BADGE_MS,
        );
      })
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

  // DB의 count_active_bingo_slots와 같은 기준으로 센다. 참여 중인 팀은 남의 공유판이라도
  // 한 칸을 쓴다(20260908150000_shared_team_bingo_limit). 여기서 공유판을 빼고 세던 때는
  // 화면상 여유가 있어 보여서, 수락을 눌러야 트리거가 막고 "잠시 후 다시 시도"만 떴다.
  const myBingoCount = bingos.length;
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
    // 경쟁하기는 내 빙고를 직접 만들어야 해서 여기서 바로 수락할 수 없다
    if (item.teamMode === 'competition') {
      navigateOnce({ pathname: '/bingo/team-invite', params: { teamId: item.target_id } });
      return;
    }

    setStripPendingId(item.id);
    try {
      const invite = await fetchTeamInvite(item.target_id);
      if (!invite) throw new Error('초대를 찾을 수 없어요.');
      // teamMode는 알림 목록이 team_bingos를 따로 조회해 채운다. 그 조회가 비면
      // 경쟁하기 초대가 위 분기를 그냥 지나쳐 '참여할 빙고판이 필요합니다'로 죽는다.
      // 여기서 온 mode가 원본이므로 한 번 더 본다.
      if (invite.mode === 'competition') {
        navigateOnce({ pathname: '/bingo/team-invite', params: { teamId: item.target_id } });
        return;
      }
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
      // 이미 취소·종료된 초대는 다시 눌러도 같은 실패만 반복된다. 알림을 지워 없앤다.
      if (isDeadInvite(e)) {
        await deleteNotificationByTarget(item.type, item.target_id).catch(Sentry.captureException);
        dismissStrip(item);
      }
      setNotice({ title: '수락하지 못했어요', body: acceptErrorMessage(e) });
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
          <Loading />
        </View>
      </View>
    );
  }

  if (loadFailed && bingos.length === 0) {
    return (
      <View className="flex-1 bg-white  ">
        {strip}
        <ErrorState onRetry={loadData} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {strip}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        // 판 사이 간격. 카드가 아니라 여기서 준다 — 같은 카드를 상세 화면도 쓴다.
        contentContainerStyle={{ gap: 40 }}
        // 안내 4단계는 구멍으로 터치가 통과해 드래그가 그대로 스크롤이 된다.
        // 멎을 때마다 다시 재야 구멍이 버튼을 따라간다.
        {...coachScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.green[500]}
          />
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
          <View className="mt-40 items-center px-4">
            <Text className="text-center text-body-md text-gray-900">
              {'빙고가 하나도 없어요\n첫 빙고를 만들어 볼까요?'}
            </Text>
            <View className="h-10" />
            <CreateBingoButtons onCreate={navigateOnce} hasFriends={hasFriends} />
            {/* 원본 757×638. contain 으로 비율을 지킨다 */}
            <Image
              source={require('@/assets/mascots/3D_01.png')}
              style={{ width: 160, height: 135, marginTop: 32 }}
              resizeMode="contain"
            />
          </View>
        )}

        {/* 빙고가 있을 때: 목록 아래에 추가 카드, 상한에 닿으면 안내 문구 */}
        {bingos.length > 0 &&
          (myBingoCount < MAX_BINGOS ? (
            <View className="px-4">
              <View className="items-center rounded-[20px] bg-white px-5 py-6">
                <Text className="mb-5 text-body-md text-gray-800">
                  빙고 추가하기 ({myBingoCount}/{MAX_BINGOS})
                </Text>
                <CreateBingoButtons onCreate={navigateOnce} hasFriends={hasFriends} />
              </View>
            </View>
          ) : (
            <View className="items-center px-4">
              <Text className="text-body-md text-gray-700">
                빙고는 한 번에 {MAX_BINGOS}개까지 진행할 수 있어요
              </Text>
            </View>
          ))}

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
