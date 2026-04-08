import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import {
  fetchBattleStatusDetail,
  quitBattle,
  type BattleStatusDetail,
  type BattleBoardSummary,
} from '@/features/battle/lib/battle';
import BingoPreview from '@/components/BingoPreview';
import type { BingoData } from '@/types/bingo';
import { Modal as RNModal, Pressable } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Information } from '@/components/Information';
import { DonutStat } from '@/features/bingo/components/DonutStat';
import { calcMaxBingo } from '@/lib/calcMaxBingo';
import { Modal } from '@/components/Modal';
import InfoIcon from '@/assets/icons/ic_info.svg';
import MenuIcon from '@/assets/icons/ic_more_vert.svg';
import { Popover } from '@/components/Popover';

function calcDday(targetDate: string | null): number {
  if (!targetDate) return 0;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** BattleBoard → BingoData */
function toBingoData(
  board: BattleBoardSummary & { userId: string; displayName: string },
): BingoData {
  return {
    id: board.id,
    title: board.title,
    grid: board.grid,
    theme: board.theme,

    cells: board.cells,

    maxEdits: 0,
    achievedCount: board.checkedCount,
    bingoCount: board.bingoCount,

    dday: calcDday(board.targetDate ?? null),

    startDate: null,
    targetDate: board.targetDate ?? null,

    state: 'progress',
    retrospective: null,
  };
}

export default function BattleStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { battleId } = useLocalSearchParams<{ battleId: string }>();

  const [detail, setDetail] = useState<BattleStatusDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBingo, setSelectedBingo] = useState<BingoData | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!battleId) return;
    fetchBattleStatusDetail(battleId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [battleId]);

  const myBingo = useMemo(() => {
    if (!detail) return null;
    return toBingoData(detail.myBoard);
  }, [detail]);
  const [my_cols, my_rows] = myBingo?.grid.split('x').map(Number) || [3, 3];

  const friendBingo = useMemo(() => {
    if (!detail) return null;
    return toBingoData(detail.friendBoard);
  }, [detail]);
  const [friend_cols, friend_rows] = friendBingo?.grid.split('x').map(Number) || [3, 3];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isCompleted = detail?.status === 'completed';

  return (
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300 dark:border-gray-700">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">대결 현황</Text>
        <IconButton
          variant="ghost"
          onClick={() => setShowMenu(true)}
          icon={<MenuIcon width={20} height={20} />}
        />
      </View>
      <Popover
        visible={showMenu}
        onDismiss={() => setShowMenu(false)}
        style={{ top: insets.top + 50, right: 16 }} // 헤더 우측 위치
        items={[
          {
            label: '그만두기',
            danger: true,
            onPress: () => setShowQuitModal(true),
          },
        ]}
      />

      {!detail || !myBingo || !friendBingo ? (
        <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
          <Text className="text-body-md text-gray-400">대결 정보를 불러올 수 없어요.</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: insets.bottom + 32,
          }}
        >
          <View className="flex-row items-center gap-2 mx-5 mb-5">
            <Text className="text-title-lg">{isCompleted ? '대결 종료' : `D-${myBingo.dday}`}</Text>
            <Information content={<Text>두 빙고의 종료일 중 더 많이 남은 날짜 기준이에요.</Text>} />
          </View>
          {/* 내기 */}
          {detail.betText && (
            <View className="mx-5 mb-8">
              <Text className="text-title-md mb-1">내기 내용</Text>
              <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                <Text className="text-body-md">{detail.betText}</Text>
              </View>
            </View>
          )}

          {/* 사람 */}
          <View className="flex flex-row mb-4 mx-5 gap-3">
            <View className="flex-1 w-1/2">
              <View className="flex-row gap-2 items-center">
                <ProfileAvatar avatarUrl={detail.myBoard.avatarUrl} size={28} />
                <Text className="text-body-md">
                  {detail.myBoard.displayName}
                  {detail.myScore > detail.friendScore ? ' 🔥' : ''}
                </Text>
              </View>
            </View>

            <View className="flex-1 w-1/2">
              <View className="flex-row gap-2 items-center">
                <ProfileAvatar avatarUrl={detail.friendBoard.avatarUrl} size={28} />
                <Text className="text-body-md">
                  {detail.friendBoard.displayName}
                  {detail.friendScore > detail.myScore ? ' 🔥' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* 빙고 */}
          <View className="flex-row mx-5 justify-center gap-4">
            <View className="rounded-xl overflow-hidden">
              <BingoPreview
                bingo={myBingo}
                className="w-48"
                completedCells={detail.myBoard.completedCells}
                onPress={() => setSelectedBingo(myBingo)}
              />
            </View>
            <View className="rounded-xl overflow-hidden">
              <BingoPreview
                bingo={friendBingo}
                className="w-48"
                completedCells={detail.friendBoard.completedCells}
                onPress={() => setSelectedBingo(friendBingo)}
              />
            </View>
          </View>

          {/* 점수 */}
          <View className="flex flex-row mt-8 mx-5">
            <View className="flex-1 items-center gap-4">
              <View className="flex-row gap-2">
                <DonutStat
                  label="달성"
                  current={myBingo.achievedCount}
                  total={my_cols * my_rows}
                  size="sm"
                />
                <DonutStat
                  label="빙고"
                  current={myBingo.bingoCount}
                  total={calcMaxBingo(my_cols, my_rows)}
                  size="sm"
                />
              </View>
              <Text className="text-title-lg">{detail.myScore}점</Text>
            </View>

            <View className="flex-1 items-center gap-4">
              <View className="flex-row gap-2">
                <DonutStat
                  label="달성"
                  current={friendBingo.achievedCount}
                  total={friend_cols * friend_rows}
                  size="sm"
                />
                <DonutStat
                  label="빙고"
                  current={friendBingo.bingoCount}
                  total={calcMaxBingo(friend_cols, friend_rows)}
                  size="sm"
                />
              </View>
              <Text className="text-title-lg">{detail.friendScore}점</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2 mx-5 bg-gray-200 rounded-2xl p-3 mt-8">
            <InfoIcon width={20} height={20} color="#4C5252" />
            <Text className="text-caption-md ">
              점수는 1칸 = 1점, 빙고 1줄 = 보너스 2점으로 합산돼요.
            </Text>
          </View>
        </ScrollView>
      )}
      {/* 확대 오버레이 */}
      <RNModal visible={!!selectedBingo} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/80 items-center justify-center"
          onPress={() => setSelectedBingo(null)}
        >
          {selectedBingo && (
            <View className="w-full px-5">
              <BingoPreview
                bingo={selectedBingo}
                className="w-full"
                size="md"
                completedCells={
                  selectedBingo.id === myBingo?.id
                    ? detail?.myBoard.completedCells
                    : detail?.friendBoard.completedCells
                }
              />
            </View>
          )}
        </Pressable>
      </RNModal>

      {/* 그만두기 확인 모달 */}
      <Modal
        visible={showQuitModal}
        title="정말로 친구와 대결을 그만둘까요?"
        body="대결을 그만두면 상대방도 연결이 끊어져요"
        variant="warning"
        confirmLabel="그만두기"
        cancelLabel="취소하기"
        onCancel={() => setShowQuitModal(false)}
        onDismiss={() => setShowQuitModal(false)}
        onConfirm={async () => {
          if (quitting) return;

          setShowQuitModal(false);
          setQuitting(true);
          try {
            await quitBattle(battleId);
            router.back();
          } catch (e) {
            setErrorMessage(e instanceof Error ? e.message : '대결 종료에 실패했어요.');
          } finally {
            setQuitting(false);
          }
        }}
      />

      <Modal
        visible={!!errorMessage}
        title="오류"
        body={errorMessage ?? ''}
        variant="error"
        confirmLabel="확인"
        onConfirm={() => setErrorMessage(null)}
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
}
