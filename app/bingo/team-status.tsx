import * as Sentry from '@sentry/react-native';
import { useCallback, useRef, useState } from 'react';
import { Modal as RNModal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import IconButton from '@/components/IconButton';
import { Modal } from '@/components/Modal';
import { Popover } from '@/components/Popover';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Information } from '@/components/Information';
import BingoPreview from '@/components/BingoPreview';
import Loading from '@/components/Loading';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import MenuIcon from '@/assets/icons/ic_more_vert.svg';
import InfoIcon from '@/assets/icons/ic_info.svg';
import { DonutStat } from '@/features/bingo/components/DonutStat';
import { WinnerCrown } from '@/features/team/components/WinnerCrown';
import {
  fetchTeamDetail,
  fetchTeamRetrospectives,
  leaveTeam,
  saveMyRetrospective,
  type TeamBoardSummary,
  type TeamDetail,
  type TeamMemberEntry,
  type TeamRetrospective,
} from '@/features/team/lib/team';
import { calcDaysUntilStart, calcTeamDday } from '@/features/team/lib/team-result';
import { calcMaxBingo } from '@/lib/calcMaxBingo';
import { useResponsive } from '@/lib/use-responsive';
import { TEAM_MODE_DESCRIPTION, TEAM_MODE_LABEL } from '@/types/team';
import type { BingoData } from '@/types/bingo';

function toBingoData(board: TeamBoardSummary, endDate: string): BingoData {
  return {
    id: board.id,
    title: board.title,
    grid: board.grid,
    theme: board.theme,
    cells: board.cells,
    maxEdits: 0,
    achievedCount: board.checkedCount,
    bingoCount: board.bingoCount,
    dday: calcTeamDday(endDate),
    startDate: null,
    targetDate: endDate,
    state: 'progress',
    retrospective: null,
  };
}

const percent = (achieved: number, total: number): number =>
  total > 0 ? Math.round((achieved / total) * 100) : 0;

/** 기간 상태를 한 줄로 */
function periodLabel(detail: TeamDetail): string {
  if (detail.isFinished) return '종료';
  if (!detail.isStarted) return `${calcDaysUntilStart(detail.startDate)}일 후 시작`;
  return `D-${calcTeamDday(detail.endDate)}`;
}

interface MemberColumnProps {
  member: TeamMemberEntry;
  showRank: boolean;
  isFinished: boolean;
  /** 같이 채우기에서는 기여 칸 수만 보여준다 */
  contributionOnly: boolean;
}

function MemberColumn({ member, showRank, isFinished, contributionOnly }: MemberColumnProps) {
  const pending = member.status === 'invited';

  return (
    <View className="items-center gap-1 w-[72px]" style={{ opacity: pending ? 0.4 : 1 }}>
      <View className="relative">
        <WinnerCrown visible={showRank && isFinished && member.rank === 1} />
        <ProfileAvatar avatarUrl={member.avatarUrl} size={40} />
      </View>
      <Text className="text-caption-md" numberOfLines={1}>
        {member.displayName}
      </Text>
      {pending ? (
        <Text className="text-caption-sm text-gray-400">수락 대기</Text>
      ) : contributionOnly ? (
        <Text className="text-caption-sm text-gray-700">{member.achievedCount}칸</Text>
      ) : (
        <Text className="text-caption-sm text-gray-700">
          {percent(member.achievedCount, member.totalCount)}%
        </Text>
      )}
    </View>
  );
}

export default function TeamStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { isTablet } = useResponsive();
  const donutSize = isTablet ? 'md' : 'sm';

  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState<TeamBoardSummary | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retrospectives, setRetrospectives] = useState<TeamRetrospective[]>([]);
  const [myRetrospective, setMyRetrospective] = useState('');
  const retroDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!teamId) return;
      Promise.all([fetchTeamDetail(teamId), fetchTeamRetrospectives(teamId)])
        .then(([teamDetail, retros]) => {
          setDetail(teamDetail);
          setRetrospectives(retros);
          setMyRetrospective(retros.find((r) => r.isMe)?.content ?? '');
        })
        .catch(() => setErrorMessage('팀 정보를 불러오지 못했어요.'))
        .finally(() => setLoading(false));
    }, [teamId]),
  );

  const handleRetrospectiveChange = (value: string) => {
    setMyRetrospective(value);
    if (retroDebounceRef.current) clearTimeout(retroDebounceRef.current);
    retroDebounceRef.current = setTimeout(() => {
      saveMyRetrospective(teamId, value).catch(Sentry.captureException);
    }, 500);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Loading color="#6ADE50" />
      </View>
    );
  }

  const isShared = detail?.mode === 'shared';
  const joined = detail?.members.filter((m) => m.status === 'joined') ?? [];
  const winners = joined.filter((m) => m.rank === 1);
  const sharedBoard = detail?.sharedBoard ?? null;
  const [sharedCols, sharedRows] = (sharedBoard?.grid ?? '3x3').split('x').map(Number);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm font-pretendard-medium">팀 빙고</Text>
        {detail?.isFinished ? (
          <View className="w-8" />
        ) : (
          <IconButton
            variant="ghost"
            onClick={() => setShowMenu(true)}
            icon={<MenuIcon width={20} height={20} />}
          />
        )}
      </View>

      <Popover
        visible={showMenu}
        onDismiss={() => setShowMenu(false)}
        style={{ top: insets.top + 50, right: 16 }}
        items={[{ label: '팀 나가기', danger: true, onPress: () => setShowLeaveModal(true) }]}
      />

      {!detail ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-body-md text-gray-400">팀 정보를 불러올 수 없어요.</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 32 }}
        >
          {/* 제목 + 기간 */}
          <View className="flex-row gap-4 mx-5 mb-2 items-center">
            <Text className="font-pretendard-semibold text-3xl flex-1" numberOfLines={1}>
              {detail.title}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-xl text-gray-600">{periodLabel(detail)}</Text>
              <Information
                content={<Text>팀을 만든 사람이 정한 기간이에요. 모두 같은 기간을 써요.</Text>}
              />
            </View>
          </View>

          <View className="mx-5 mb-6">
            <Text className="text-caption-md text-gray-600">
              {TEAM_MODE_LABEL[detail.mode]} · {TEAM_MODE_DESCRIPTION[detail.mode]}
            </Text>
          </View>

          {/* 시작 전 안내 */}
          {!detail.isStarted && (
            <View className="mx-5 mb-6 bg-gray-200 rounded-2xl p-4">
              <Text className="text-body-md">
                {calcDaysUntilStart(detail.startDate)}일 후 다 같이 시작해요. 그때부터 칸을 채울 수
                있어요.
              </Text>
            </View>
          )}

          {/* 종료 결과 */}
          {detail.isFinished && (
            <View className="mx-5 mb-6 items-center bg-green-200 rounded-2xl py-4 px-4">
              {isShared ? (
                <Text className="text-title-md font-pretendard-semibold text-center">
                  {sharedBoard
                    ? `우리 팀은 ${sharedBoard.totalCells}칸 중 ${sharedBoard.checkedCount}칸을 채웠어요 👏`
                    : '팀 빙고가 끝났어요 👏'}
                </Text>
              ) : winners.length === 0 ? (
                <Text className="text-title-md font-pretendard-semibold">
                  팀 빙고가 끝났어요 👏
                </Text>
              ) : (
                <Text className="text-title-md font-pretendard-semibold text-center">
                  {winners.map((w) => w.displayName).join(', ')}님이 1등이에요! 👑
                </Text>
              )}
            </View>
          )}

          {/* 내기 */}
          {detail.betText && (
            <View className="mx-5 mb-8">
              <Text className="text-title-md mb-3 font-pretendard-semibold">내기 내용</Text>
              <View className="p-4 bg-gray-100 rounded-2xl">
                <Text className="text-body-md md:text-body-lg">{detail.betText}</Text>
              </View>
            </View>
          )}

          {/* 같이 채우기: 팀 전체 진행률이 주인공 */}
          {isShared && sharedBoard && (
            <View className="mx-5 mb-8 items-center gap-4">
              <View className="flex-row gap-2">
                <DonutStat
                  label="팀 달성"
                  current={sharedBoard.checkedCount}
                  total={sharedBoard.totalCells}
                  size={donutSize}
                />
                <DonutStat
                  label="빙고"
                  current={sharedBoard.bingoCount}
                  total={calcMaxBingo(sharedCols, sharedRows)}
                  size={donutSize}
                />
              </View>
              <Text className="text-title-lg">
                {sharedBoard.checkedCount} / {sharedBoard.totalCells}칸
              </Text>
            </View>
          )}

          {/* 멤버 나열: 1등이 왼쪽 */}
          <View className="mb-6">
            <Text className="text-title-md mx-5 mb-3 font-pretendard-semibold">
              {isShared ? '누가 얼마나 채웠나요' : '지금 순위'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {detail.members.map((member) => (
                <MemberColumn
                  key={member.userId}
                  member={member}
                  showRank={!isShared}
                  isFinished={detail.isFinished}
                  contributionOnly={isShared}
                />
              ))}
            </ScrollView>
          </View>

          {/* 빙고판 */}
          {isShared ? (
            sharedBoard && (
              <View className="mx-5 items-center">
                <View className="rounded-xl overflow-hidden">
                  <BingoPreview
                    bingo={toBingoData(sharedBoard, detail.endDate)}
                    className="w-64 md:w-[360px]"
                    completedCells={sharedBoard.completedCells}
                    onPress={() => setSelectedBoard(sharedBoard)}
                  />
                </View>
              </View>
            )
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            >
              {detail.members
                .filter((m) => m.status === 'joined')
                .map((member) => {
                  const board = detail.boards[member.userId];
                  if (!board) return null;
                  const [cols, rows] = board.grid.split('x').map(Number);
                  return (
                    <View key={member.userId} className="items-center gap-2">
                      <View className="rounded-xl overflow-hidden">
                        <BingoPreview
                          bingo={toBingoData(board, detail.endDate)}
                          className="w-48 md:w-[360px]"
                          completedCells={board.completedCells}
                          onPress={() => setSelectedBoard(board)}
                        />
                      </View>
                      <View className="flex-row gap-2">
                        <DonutStat
                          label="달성"
                          current={board.checkedCount}
                          total={board.totalCells}
                          size={donutSize}
                        />
                        <DonutStat
                          label="빙고"
                          current={board.bingoCount}
                          total={calcMaxBingo(cols, rows)}
                          size={donutSize}
                        />
                      </View>
                    </View>
                  );
                })}
            </ScrollView>
          )}

          {/* 회고: 사람마다 따로 쓴다 */}
          {detail.isFinished && (
            <View className="mx-5 mt-10">
              <Text className="text-title-md mb-2 font-pretendard-semibold">회고</Text>
              <Text className="text-caption-md text-gray-600 mb-3">
                이 기간이 나에게 어땠는지 남겨보세요. 팀원들도 볼 수 있어요.
              </Text>

              <View style={{ position: 'relative' }}>
                <TextInput
                  value={myRetrospective}
                  onChangeText={handleRetrospectiveChange}
                  placeholder="회고를 남겨보세요."
                  placeholderTextColor="#B4BBBB" /* gray-400 */
                  multiline
                  maxLength={500}
                  className="h-[140px] bg-gray-100 rounded-2xl p-4 text-body-md"
                  style={{ textAlignVertical: 'top', paddingBottom: 28 }}
                />
                <Text
                  className="text-caption-sm text-gray-500"
                  style={{ position: 'absolute', bottom: 10, right: 14 }}
                >
                  {myRetrospective.length}/500
                </Text>
              </View>

              {retrospectives
                .filter((r) => !r.isMe && r.content.trim())
                .map((retro) => (
                  <View key={retro.userId} className="mt-4 bg-gray-100 rounded-2xl p-4 gap-2">
                    <View className="flex-row items-center gap-2">
                      <ProfileAvatar avatarUrl={retro.avatarUrl} size={24} />
                      <Text className="text-caption-md text-gray-700">{retro.displayName}</Text>
                    </View>
                    <Text className="text-body-md">{retro.content}</Text>
                  </View>
                ))}
            </View>
          )}

          <View className="flex-row items-center gap-2 mx-5 bg-gray-200 rounded-2xl p-3 mt-8">
            <InfoIcon width={20} height={20} color="#4C5252" />
            <Text className="text-caption-md md:text-body-md flex-1">
              {isShared
                ? '먼저 누른 사람이 그 칸의 주인이 돼요. 채운 칸은 그 사람만 해제할 수 있어요.'
                : detail.isResultFrozen
                  ? '순위는 종료 시점 달성률로 확정됐어요.'
                  : '순위는 달성률(채운 칸 ÷ 전체 칸)로 정해져요. 판 크기가 달라도 공평해요.'}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* 확대 오버레이 */}
      <RNModal visible={!!selectedBoard} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/80 items-center justify-center"
          onPress={() => setSelectedBoard(null)}
        >
          {selectedBoard && detail && (
            <View className="w-full px-5">
              <BingoPreview
                bingo={toBingoData(selectedBoard, detail.endDate)}
                className="w-full"
                size="md"
                completedCells={selectedBoard.completedCells}
              />
            </View>
          )}
        </Pressable>
      </RNModal>

      <Modal
        visible={showLeaveModal}
        title="팀에서 나갈까요?"
        body={
          isShared
            ? '내가 채운 칸은 그대로 남아요. 방장이라면 다음 사람에게 넘어가요.'
            : '내 빙고는 개인 빙고로 남아요. 팀 순위에서만 빠져요.'
        }
        variant="warning"
        confirmLabel="나가기"
        cancelLabel="취소하기"
        onCancel={() => setShowLeaveModal(false)}
        onDismiss={() => setShowLeaveModal(false)}
        onConfirm={async () => {
          if (leaving) return;
          setShowLeaveModal(false);
          setLeaving(true);
          try {
            await leaveTeam(teamId);
            router.back();
          } catch (e) {
            setErrorMessage(e instanceof Error ? e.message : '팀 나가기에 실패했어요.');
          } finally {
            setLeaving(false);
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
