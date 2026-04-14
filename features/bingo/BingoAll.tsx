import * as Sentry from '@sentry/react-native';
import { InteractionManager, ScrollView, Pressable, View } from 'react-native';
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
import { applyBingoOrder, loadBingoOrder } from '@/features/bingo/lib/bingo-order';
import { fetchBattleByBoardId, fetchMyBattles } from '@/features/battle/lib/battle';
import { getCache, setCache } from '@/lib/cache';
import { MAX_BINGOS } from '@/constants/bingo';
import { CACHE_KEY_ALL } from '@/constants/cache_key';
import Loading from '@/components/Loading';

export function BingoAll() {
  const router = useRouter();
  const [bingos, setBingos] = useState<BingoData[]>([]);
  const [cellDetails, setCellDetails] = useState<Record<string, BingoCellDetail[]>>({});
  const [battleIds, setBattleIds] = useState<Record<string, string | null>>({});
  const [friendAvatars, setFriendAvatars] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<{ bingoId: string; cellIndex: number } | null>(
    null,
  );
  const memoDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isNavigatingRef = useRef(false);

  const loadData = useCallback(() => {
    Promise.all([fetchMyBingos(), loadBingoOrder()]).then(async ([fetched, savedOrder]) => {
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

      // 만료된 빙고는 BingoAll에서 제외 (BingoHistory 완료 탭으로 이동)
      const progressBingos = serverBingos.filter((b) => !expiredIds.includes(b.id));
      const ordered = applyBingoOrder(progressBingos, savedOrder);
      const sliced = ordered.slice(0, MAX_BINGOS);
      setBingos(sliced);
      setCellDetails(details);
      setLoading(false);
      setCache(CACHE_KEY_ALL, { bingos: sliced, cellDetails: details });

      // 각 빙고의 배틀 여부 조회 + 상대방 아바타
      const [battleResults, myBattles] = await Promise.all([
        Promise.all(sliced.map((b) => fetchBattleByBoardId(b.id))),
        fetchMyBattles(),
      ]);
      const ids: Record<string, string | null> = {};
      const avatars: Record<string, string | null> = {};
      sliced.forEach((b, i) => {
        ids[b.id] = battleResults[i]?.battleId ?? null;
        const battle = myBattles.find((bt) => bt.myBoardId === b.id);
        avatars[b.id] = battle?.opponent.avatarUrl ?? null;
      });
      startTransition(() => {
        setBattleIds(ids);
        setFriendAvatars(avatars);
      });
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      // 배틀 상태는 항상 최신으로 다시 받아야 하므로 포커스 시 초기화
      setBattleIds({});
      setFriendAvatars({});

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

  const handleCellPress = (bingo: BingoData, cellIndex: number) => {
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
      updateCell(cellId, nonMemoUpdates).catch(Sentry.captureException);
    }
    if (memo !== undefined) {
      clearTimeout(memoDebounceRef.current[cellId]);
      memoDebounceRef.current[cellId] = setTimeout(() => {
        updateCell(cellId, { memo }).catch(Sentry.captureException);
      }, 500);
    }
  };

  const modalCells = modalTarget ? (cellDetails[modalTarget.bingoId] ?? []) : [];

  if (loading) {
    return (
      <View className="flex-1 mt-[50px] items-center justify-center bg-white dark:bg-gray-900">
        <Loading color="6ADE50" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 mt-[60px] dark:bg-gray-900">
      {bingos.map((bingo) => (
        <BingoCard
          key={bingo.id}
          bingo={bingo}
          completedCells={cellDetails[bingo.id]?.map((c) => c.completed)}
          onCellPress={(cellIndex) => handleCellPress(bingo, cellIndex)}
          onEditPress={() =>
            bingo.id === 'draft_0'
              ? router.push({ pathname: '/bingo/add', params: { loadDraft: 'true' } })
              : router.push({ pathname: '/bingo/modify', params: { bingoId: bingo.id } })
          }
          hasBattle={!!battleIds[bingo.id]}
          friendAvatarUrl={friendAvatars[bingo.id]}
          onBattlePress={() => {
            const battleId = battleIds[bingo.id];
            if (battleId) {
              router.push({ pathname: '/bingo/battle-status', params: { battleId } });
            } else {
              router.push({
                pathname: '/bingo/battle',
                params: { bingoId: bingo.id, bingoTitle: bingo.title },
              });
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

      {/* 새 빙고 추가 섹션 */}
      {bingos.length < MAX_BINGOS && (
        <View className="px-5 mt-10">
          <Pressable
            onPress={() => {
              if (isNavigatingRef.current) return;
              isNavigatingRef.current = true;
              router.push('/bingo/add');
              setTimeout(() => {
                isNavigatingRef.current = false;
              }, 1000);
            }}
            className="items-center justify-center gap-3 bg-green-100 w-full h-[230px] rounded-[20px]"
          >
            <AddIcon width={40} height={40} color="#4C5252" /* gray-700 */ />
            <Text className="text-title-md" style={{ color: '#4C5252' /* gray-700 */ }}>
              새 빙고 추가하기
            </Text>
            <Text className="text-title-md" style={{ color: '#4C5252' /* gray-700 */ }}>
              ({bingos.length}/{MAX_BINGOS})
            </Text>
          </Pressable>
        </View>
      )}
      <View className="h-24" />

      <BingoCellModal
        visible={!!modalTarget}
        cells={modalCells}
        initialIndex={modalTarget?.cellIndex ?? 0}
        onClose={() => setModalTarget(null)}
        onUpdate={handleCellUpdate}
      />
    </ScrollView>
  );
}
