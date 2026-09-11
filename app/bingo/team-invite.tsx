import * as Sentry from '@sentry/react-native';

import { useEffect, useRef, useState } from 'react';

import { ScrollView, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import BingoPreview from '@/components/BingoPreview';
import Loading from '@/components/Loading';
import { PageHeader } from '@/components/PageHeader';
import { BingoTitle } from '@/features/bingo/bingo-edit/BingoTitle';
import { WriteBingo } from '@/features/bingo/bingo-edit/WriteBingo';
import {
  acceptErrorMessage,
  acceptTeamInvite,
  fetchTeamInvite,
  rejectTeamInvite,
  type TeamInviteItem,
} from '@/features/team/lib/team';
import { calcDaysUntilStart, calcTeamDday, isTeamStarted } from '@/features/team/lib/team-result';
import { TEAM_MODE_LABEL } from '@/types/team';
import type { BingoData } from '@/types/bingo';
import { useTranslation } from 'react-i18next';

export default function TeamInviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();

  const [invite, setInvite] = useState<TeamInviteItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // check before writing my bingo
  const [composing, setComposing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // write my bingo
  const [myTitle, setMyTitle] = useState('');
  const [selectedGrid, setSelectedGrid] = useState('3x3');
  const [selectedEditCount, setSelectedEditCount] = useState('0');
  const [selectedTheme, setSelectedTheme] = useState('default');
  const cellsRef = useRef<string[]>([]);

  const editCountKey = (maxEdits: number): string =>
    maxEdits === 9999 || maxEdits === -1 ? t('home.field.modifyCount.label') : String(maxEdits);

  useEffect(() => {
    if (!teamId) return;

    fetchTeamInvite(teamId)
      .then((data) => {
        setInvite(data);

        if (data) {
          setMyTitle(data.title);
        }
      })
      .catch(() => setAlertMessage(`${t('home.error.loadInvite')} ${t('common.error.retry')}`))
      .finally(() => setLoading(false));
  }, [teamId, t]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Loading />
      </View>
    );
  }

  const ownerBoard = invite?.ownerBoard ?? null;
  const isCompetition = invite?.mode === 'competition';
  const started = invite ? isTeamStarted(invite.startDate) : false;

  const previewBingo: BingoData | null = ownerBoard
    ? {
        id: ownerBoard.id,
        title: ownerBoard.title,
        grid: ownerBoard.grid,
        theme: ownerBoard.theme,
        cells: ownerBoard.cells,
        maxEdits: 0,
        achievedCount: ownerBoard.checkedCount,
        bingoCount: ownerBoard.bingoCount,
        dday: invite ? calcTeamDday(invite.endDate) : 0,
        startDate: invite?.startDate ?? null,
        targetDate: invite?.endDate ?? null,
        state: 'progress',
        retrospective: null,
      }
    : null;

  const confirmLabel = isCompetition
    ? composing
      ? t('home.modal.save.confirm')
      : t('home.okAndCreate')
    : t('home.doWith');

  const handleConfirm = () => {
    if (isCompetition && !composing) {
      setComposing(true);
      return;
    }

    void handleAccept();
  };

  const handleAccept = async () => {
    if (!invite || acting) return;

    if (isCompetition) {
      const [cols, rows] = selectedGrid.split('x').map(Number);

      if (!myTitle.trim()) {
        return setAlertMessage(t('home.field.title.label'));
      }

      if (cellsRef.current.filter((cell) => cell?.trim()).length < cols * rows) {
        return setAlertMessage(t('home.alert.fillAllCells'));
      }
    }

    setActing(true);

    try {
      await acceptTeamInvite({
        teamId,
        board: isCompetition
          ? {
              title: myTitle.trim(),
              grid: selectedGrid,
              theme: selectedTheme,
              editCount: selectedEditCount,
              cells: cellsRef.current,
            }
          : invite.mode === 'copied' && ownerBoard
            ? {
                title: ownerBoard.title,
                grid: ownerBoard.grid,
                theme: ownerBoard.theme,
                editCount: editCountKey(invite.ownerBoardMaxEdits),
                cells: ownerBoard.cells,
              }
            : undefined,
      });

      router.replace({
        pathname: '/bingo/team-status',
        params: { teamId },
      });
    } catch (e) {
      Sentry.captureException(e);
      setAlertMessage(acceptErrorMessage(e));
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    setShowRejectModal(false);
    setActing(true);

    try {
      await rejectTeamInvite(teamId);
      router.back();
    } catch (e) {
      setAlertMessage(
        e instanceof Error ? e.message : `${t('home.error.reject')} ${t('common.error.retry')}`,
      );
    } finally {
      setActing(false);
    }
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title={invite ? TEAM_MODE_LABEL[invite.mode] : t('home.invite')} />

      {!invite ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-body-md text-gray-400">
            {t('home.error.loadInvite')} {t('common.error.retry')}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-6 gap-3 px-4">
            <View className="flex-row items-center gap-3">
              <ProfileAvatar avatarUrl={invite.ownerAvatarUrl} size={32} />

              <Text className="flex-1 text-body-md text-gray-900">
                {t(isCompetition ? 'home.inviteCompetitionMessage' : 'home.inviteTogetherMessage', {
                  name: invite.ownerDisplayName,
                })}
              </Text>
            </View>

            <Text className="text-body-md text-gray-800">
              {t('home.period', {
                startDate: invite.startDate.replaceAll('-', '.'),
                endDate: invite.endDate.replaceAll('-', '.'),
              })}
            </Text>

            <View>
              <Text className="text-body-sm text-gray-700">
                {started
                  ? t('home.daysUntilEnd', {
                      days: calcTeamDday(invite.endDate),
                    })
                  : t('home.daysUntilStart', {
                      days: calcDaysUntilStart(invite.startDate),
                    })}
              </Text>

              <Text className="text-body-sm text-gray-700">
                {t('home.currentMemberCount', {
                  count: invite.memberCount,
                })}
              </Text>
            </View>

            {invite.betText && (
              <View className="rounded-2xl bg-gray-200 px-4 py-3">
                <Text className="mb-1 text-caption-md text-gray-700">
                  {t('home.field.bet.label')}
                </Text>

                <Text className="text-body-md text-gray-900">{invite.betText}</Text>
              </View>
            )}
          </View>

          {previewBingo && !composing && (
            <View className="mt-8">
              <BingoPreview
                bingo={previewBingo}
                className="w-full"
                completedCells={ownerBoard?.completedCells}
              />
            </View>
          )}

          {composing && (
            <View className="mt-8">
              <Text className="px-4 pb-2 text-caption-md text-gray-700">
                {t('home.composingDescription')}
              </Text>

              <BingoTitle value={myTitle} onChange={setMyTitle} />

              <WriteBingo
                title={myTitle}
                selectedGrid={selectedGrid}
                onGridSelect={setSelectedGrid}
                selectedEditCount={selectedEditCount}
                onEditCountSelect={setSelectedEditCount}
                selectedTheme={selectedTheme}
                onThemeSelect={setSelectedTheme}
                cells={[]}
                onCellsChange={(value) => {
                  cellsRef.current = value;
                }}
              />
            </View>
          )}
        </ScrollView>
      )}

      {invite && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row gap-2 bg-surface px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <Button
            label={composing ? t('common.previous') : t('home.rejectInvite')}
            variant="secondary"
            size="md"
            onClick={composing ? () => setComposing(false) : () => setShowRejectModal(true)}
            className="flex-1"
          />

          <Button
            label={acting ? t('home.btnLabel.processing') : confirmLabel}
            variant="primary"
            size="md"
            onClick={handleConfirm}
            className="flex-1"
          />
        </View>
      )}

      <Modal
        visible={showRejectModal}
        title={t('home.rejectInviteTitle')}
        body={t('home.rejectInviteBody')}
        variant="warning"
        cancelLabel={t('common.cancel')}
        confirmLabel={t('home.rejectInvite')}
        onCancel={() => setShowRejectModal(false)}
        onDismiss={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />

      <Modal
        visible={alertMessage !== null}
        title={alertMessage ?? ''}
        variant="single"
        confirmLabel={t('common.confirm')}
        onConfirm={() => setAlertMessage(null)}
      />
    </View>
  );
}
