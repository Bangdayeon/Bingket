import * as Sentry from '@sentry/react-native';
import { useCallback, useRef, useState } from 'react';
import { Modal as RNModal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { Popover } from '@/components/Popover';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import BingoPreview from '@/components/BingoPreview';
import Loading from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import MenuIcon from '@/assets/icons/ic_more_vert.svg';
import InfoIcon from '@/assets/icons/ic_info.svg';
import { BingoStat } from '@/features/bingo/components/BingoStat';
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
import { TEAM_MODE_DESCRIPTION } from '@/types/team';
import type { BingoData } from '@/types/bingo';
import { useTranslation } from 'react-i18next';

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

export default function TeamStatusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { isTablet } = useResponsive();
  const statSize = isTablet ? 'md' : 'sm';

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

  function periodLabel(detail: TeamDetail): string {
    if (detail.isFinished) return t('home.periodEnded');
    if (!detail.isStarted)
      return t('home.periodDaysUntilStart', { days: calcDaysUntilStart(detail.startDate) });
    return t('home.periodDday', { days: calcTeamDday(detail.endDate) });
  }

  function MemberColumn({
    member,
    showRank,
    isFinished,
    contributionOnly,
  }: {
    member: TeamMemberEntry;
    showRank: boolean;
    isFinished: boolean;
    contributionOnly: boolean;
  }) {
    const pending = member.status === 'invited';

    return (
      <View className="items-center gap-1 w-[72px]" style={{ opacity: pending ? 0.4 : 1 }}>
        <View className="relative">
          <WinnerCrown visible={showRank && isFinished && member.rank === 1} />
          <ProfileAvatar avatarUrl={member.avatarUrl} size={32} />
        </View>
        <Text className="text-body-sm text-gray-800" numberOfLines={1}>
          {member.displayName}
        </Text>
        {pending ? (
          <Text className="text-caption-sm text-gray-400">{t('home.pendingAccept')}</Text>
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

  useFocusEffect(
    useCallback(() => {
      if (!teamId) return;
      Promise.all([fetchTeamDetail(teamId), fetchTeamRetrospectives(teamId)])
        .then(([teamDetail, retros]) => {
          setDetail(teamDetail);
          setRetrospectives(retros);
          setMyRetrospective(retros.find((r) => r.isMe)?.content ?? '');
        })
        .catch(() => setErrorMessage(t('home.teamInfoLoadFail')))
        .finally(() => setLoading(false));
    }, [teamId, t]),
  );

  const handleRetrospectiveChange = (value: string) => {
    setMyRetrospective(value);
    if (retroDebounceRef.current) clearTimeout(retroDebounceRef.current);
    retroDebounceRef.current = setTimeout(() => {
      saveMyRetrospective(teamId, value).catch((e: unknown) => {
        Sentry.captureException(e);
        setErrorMessage(t('home.retrospectiveSaveFail'));
      });
    }, 500);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Loading />
      </View>
    );
  }

  const isShared = detail?.mode === 'shared';
  const joined = detail?.members.filter((m) => m.status === 'joined') ?? [];
  const winners = joined.filter((m) => m.rank === 1);
  const sharedBoard = detail?.sharedBoard ?? null;

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader
        title={detail?.title}
        titleRight={
          detail && !isShared ? (
            <Text className="text-body-md text-gray-700">{periodLabel(detail)}</Text>
          ) : undefined
        }
        right={
          detail?.isFinished ? undefined : (
            <Pressable onPress={() => setShowMenu(true)} hitSlop={8}>
              <MenuIcon width={24} height={24} className="text-gray-700" />
            </Pressable>
          )
        }
      />

      <Popover
        visible={showMenu}
        onDismiss={() => setShowMenu(false)}
        style={{ top: insets.top + 50, right: 16 }}
        items={[
          {
            label: t('home.leaveTeamMenuItem'),
            danger: true,
            onPress: () => setShowLeaveModal(true),
          },
        ]}
      />

      {!detail ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-body-md text-gray-400">{t('home.teamStatusUnavailable')}</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 32 }}
        >
          <Text className="mb-6 px-4 text-caption-md text-gray-700">
            {TEAM_MODE_DESCRIPTION[detail.mode]}
          </Text>

          {/* BEFORE START */}
          {!detail.isStarted && (
            <View className="mx-5 mb-6 bg-gray-200 rounded-2xl p-4">
              <Text className="text-body-md">
                {t('home.teamStartCountdown', { days: calcDaysUntilStart(detail.startDate) })}
              </Text>
            </View>
          )}

          {/* RESULT */}
          {detail.isFinished && (
            <View className="mx-5 mb-6 items-center bg-green-200 rounded-2xl py-4 px-4">
              {isShared ? (
                <Text className="text-title-md font-pretendard-semibold text-center">
                  {sharedBoard
                    ? t('home.teamEndedShared', {
                        total: sharedBoard.totalCells,
                        checked: sharedBoard.checkedCount,
                      })
                    : t('home.teamEndedNoWinner')}
                </Text>
              ) : winners.length === 0 ? (
                <Text className="text-title-md font-pretendard-semibold">
                  {t('home.teamEndedNoWinner')}
                </Text>
              ) : (
                <Text className="text-title-md font-pretendard-semibold text-center">
                  {t('home.teamWinner', { names: winners.map((w) => w.displayName).join(', ') })}
                </Text>
              )}
            </View>
          )}

          {/* BET */}
          {detail.betText && (
            <View className="mx-5 mb-8">
              <Text className="text-title-md mb-3 font-pretendard-semibold">
                {t('home.betContent')}
              </Text>
              <View className="p-4 bg-gray-100 rounded-2xl">
                <Text className="text-body-md">{detail.betText}</Text>
              </View>
            </View>
          )}

          {/* MEMBER LIST */}
          <View className="mb-6">
            <Text className="mb-3 px-4 text-body-md text-gray-900">{t('home.participants')}</Text>
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

          {/* BINGO */}
          {isShared ? (
            sharedBoard && (
              <BingoPreview
                bingo={toBingoData(sharedBoard, detail.endDate)}
                className="w-full"
                completedCells={sharedBoard.completedCells}
                onPress={() => setSelectedBoard(sharedBoard)}
              />
            )
          ) : detail.boardsFailed ? (
            <EmptyState message={t('home.boardLoadFailRefresh')} />
          ) : detail.members.filter((m) => m.status === 'joined').length === 0 ? (
            <EmptyState message={t('home.noJoinedMembers')} />
          ) : (
            <View className="flex-row flex-wrap gap-x-[14px] gap-y-8 px-4">
              {detail.members
                .filter((m) => m.status === 'joined')
                .map((member) => {
                  const board = detail.boards[member.userId];
                  if (!board) {
                    return (
                      <View key={member.userId} className="items-center gap-2">
                        <View className="h-[172px] w-[172px] items-center justify-center rounded-2xl bg-gray-200 px-3">
                          <Text className="text-caption-md text-center text-gray-600">
                            {t('home.boardNotCreated')}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  const [cols, rows] = board.grid.split('x').map(Number);
                  return (
                    <View key={member.userId} className="items-center gap-2">
                      <View className="w-[172px] overflow-hidden rounded-2xl">
                        <BingoPreview
                          bingo={toBingoData(board, detail.endDate)}
                          className="w-full"
                          completedCells={board.completedCells}
                          onPress={() => setSelectedBoard(board)}
                        />
                      </View>
                      <View className="flex-row gap-2">
                        <BingoStat
                          label={t('common.achieve')}
                          current={board.checkedCount}
                          total={board.totalCells}
                          size={statSize}
                        />
                        <BingoStat
                          label={t('common.bingo')}
                          current={board.bingoCount}
                          total={calcMaxBingo(cols, rows)}
                          size={statSize}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>
          )}

          {detail.isFinished && (
            <View className="mx-5 mt-10">
              <Text className="text-title-md mb-2 font-pretendard-semibold">
                {t('home.retrospectiveTitle')}
              </Text>
              <Text className="text-caption-md text-gray-600 mb-3">
                {t('home.retrospectiveDescription')}
              </Text>

              <View style={{ position: 'relative' }}>
                <TextInput
                  value={myRetrospective}
                  onChangeText={handleRetrospectiveChange}
                  placeholder={t('home.retrospectivePlaceholder')}
                  multiline
                  maxLength={500}
                  className="h-[140px] bg-gray-100 rounded-2xl p-4 text-body-md text-gray-900 placeholder:text-gray-500"
                  style={{ textAlignVertical: 'top', paddingBottom: 28 }}
                />
                <Text
                  className="text-caption-sm text-gray-500"
                  style={{ position: 'absolute', bottom: 10, right: 14 }}
                >
                  {myRetrospective.length}/500
                </Text>
              </View>

              {retrospectives.filter((r) => !r.isMe && r.content.trim()).length === 0 && (
                <Text className="mt-6 text-center text-body-sm text-gray-500">
                  {t('home.noOtherRetrospective')}
                </Text>
              )}

              {retrospectives
                .filter((r) => !r.isMe && r.content.trim())
                .map((retro) => (
                  <View key={retro.userId} className="mt-4 bg-gray-100 rounded-2xl p-4 gap-2">
                    <View className="flex-row items-center gap-2">
                      <ProfileAvatar avatarUrl={retro.avatarUrl} size={24} />
                      <Text className="flex-1 text-caption-md text-gray-700" numberOfLines={1}>
                        {retro.displayName}
                      </Text>
                    </View>
                    <Text className="text-body-md">{retro.content}</Text>
                  </View>
                ))}
            </View>
          )}

          <View className="flex-row items-center gap-2 mx-5 bg-gray-200 rounded-2xl p-3 mt-8">
            <InfoIcon width={20} height={20} className="text-gray-700" />
            <Text className="text-caption-md md:text-body-md flex-1">
              {isShared
                ? t('home.sharedModeInfo')
                : detail.isResultFrozen
                  ? t('home.rankFrozenInfo')
                  : t('home.rankInfo')}
            </Text>
          </View>
        </ScrollView>
      )}

      <RNModal visible={!!selectedBoard} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-scrim/80 items-center justify-center"
          onPress={() => setSelectedBoard(null)}
        >
          {selectedBoard && detail && (
            <View className="w-full px-4">
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
        title={t('home.leaveTeamTitle')}
        body={isShared ? t('home.leaveTeamBodyShared') : t('home.leaveTeamBodySolo')}
        variant="warning"
        confirmLabel={t('home.leaveConfirm')}
        cancelLabel={t('common.cancel')}
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
            setErrorMessage(e instanceof Error ? e.message : t('home.leaveTeamFail'));
          } finally {
            setLeaving(false);
          }
        }}
      />

      <Modal
        visible={!!errorMessage}
        title={t('common.error.general')}
        body={errorMessage ?? ''}
        variant="error"
        confirmLabel={t('common.confirm')}
        onConfirm={() => setErrorMessage(null)}
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
}
