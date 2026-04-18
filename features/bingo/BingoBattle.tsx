import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Modal } from '@/components/Modal';
import { BattleNotification } from '@/features/battle/components/BattleNotification';
import { BattleListItem } from '@/features/battle/components/BattleListItem';
import BattleDoneIcon from '@/assets/icons/ic_battle_done.svg';
import BattleProgressIcon from '@/assets/icons/ic_battle_progress.svg';
import {
  fetchMyBattleNotifications,
  fetchMyBattles,
  cancelBattleRequest,
  rejectBattleRequest,
  dismissRejectedRequest,
  type BattleNotificationItem,
  type BattleListEntry,
} from '@/features/battle/lib/battle';
import { setSelectedRequestId } from '@/features/battle/lib/battle-selection';
import Loading from '@/components/Loading';

export function BingoBattle() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<BattleNotificationItem[]>([]);
  const [battles, setBattles] = useState<BattleListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // modals
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null); // requestId
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null); // requestId
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([fetchMyBattleNotifications(), fetchMyBattles()])
      .then(([notifs, list]) => {
        setNotifications(notifs);
        setBattles(list);
      })
      .catch(() => setErrorMessage('데이터를 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setBattles([]);
      loadData();
    }, [loadData]),
  );

  const handleCancel = async (requestId: string) => {
    setActing(true);
    try {
      await cancelBattleRequest(requestId);
      setNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
    } catch {
      setErrorMessage('취소에 실패했어요.');
    } finally {
      setActing(false);
      setCancelConfirm(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActing(true);
    try {
      await rejectBattleRequest(requestId);
      setNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
    } catch {
      setErrorMessage('거절에 실패했어요.');
    } finally {
      setActing(false);
      setRejectConfirm(null);
    }
  };

  const handleDismissRejected = async (requestId: string) => {
    try {
      await dismissRejectedRequest(requestId);
      setNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
    } catch {
      // silent — just remove locally anyway
      setNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
    }
  };

  const handleAccept = (requestId: string) => {
    setSelectedRequestId(requestId);
    router.push({ pathname: '/bingo/battle-select-board', params: { mode: 'accept' } });
  };

  const ongoing = battles.filter((b) => b.variant === 'ongoing');
  const finished = battles.filter((b) => b.variant === 'finished');

  return (
    <>
      <ScrollView className="flex-1 mt-[70px] bg-white   mb-20">
        {loading ? (
          <View className="py-10 items-center">
            <Loading color="#6ADE50" />
          </View>
        ) : (
          <>
            {/* Notifications */}
            {notifications.map((notif) => (
              <BattleNotification
                key={notif.requestId}
                variant={notif.type}
                bingoTitle={notif.bingoTitle}
                friendName={notif.friendName}
                friendUsername={notif.friendUsername}
                avatarUrl={notif.avatarUrl}
                onCancel={() => setCancelConfirm(notif.requestId)}
                onClose={() => handleDismissRejected(notif.requestId)}
                onAccept={() => handleAccept(notif.requestId)}
                onReject={() => setRejectConfirm(notif.requestId)}
              />
            ))}

            {/* Ongoing battles */}
            <View className="mt-4 mx-5">
              <View className="flex-row gap-2 mb-2 items-center">
                <BattleProgressIcon />
                <Text className="text-title-md  ">승부 중 대결</Text>
              </View>
              {ongoing.length === 0 ? (
                <Text className="text-body-md text-gray-400">진행 중인 대결이 없어요.</Text>
              ) : (
                <View className="flex gap-2">
                  {ongoing.map((b) => (
                    <BattleListItem
                      key={b.battleId}
                      variant="ongoing"
                      myBoardTitle={b.myBoardTitle}
                      opponentBoardTitle={b.opponentBoardTitle}
                      battleId={b.battleId}
                      me={b.me}
                      opponent={b.opponent}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Finished battles */}
            <View className="mt-8 mx-5 mb-4">
              <View className="flex-row gap-2 mb-2 items-center">
                <BattleDoneIcon />
                <Text className="text-title-md  ">승부 난 대결</Text>
              </View>
              {finished.length === 0 ? (
                <Text className="text-body-md text-gray-400">종료된 대결이 없어요.</Text>
              ) : (
                <View className="flex gap-2">
                  {finished.map((b) => (
                    <BattleListItem
                      key={b.battleId}
                      variant="finished"
                      myBoardTitle={b.myBoardTitle}
                      opponentBoardTitle={b.opponentBoardTitle}
                      battleId={b.battleId}
                      me={b.me}
                      opponent={b.opponent}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Cancel confirm modal */}
      <Modal
        visible={!!cancelConfirm}
        title="대결 요청 취소"
        body="보낸 대결 요청을 취소할까요?"
        variant="warning"
        cancelLabel="아니요"
        confirmLabel="취소하기"
        onCancel={() => setCancelConfirm(null)}
        onConfirm={() => cancelConfirm && handleCancel(cancelConfirm)}
        onDismiss={() => setCancelConfirm(null)}
      />

      {/* Reject confirm modal */}
      <Modal
        visible={!!rejectConfirm}
        title="대결 요청 거절"
        body="이 대결 요청을 거절할까요?"
        variant="warning"
        cancelLabel="아니요"
        confirmLabel="거절하기"
        onCancel={() => setRejectConfirm(null)}
        onConfirm={() => rejectConfirm && handleReject(rejectConfirm)}
        onDismiss={() => setRejectConfirm(null)}
      />

      {/* Error modal */}
      <Modal
        visible={!!errorMessage}
        title="오류"
        body={errorMessage ?? ''}
        variant="error"
        confirmLabel="확인"
        onConfirm={() => setErrorMessage(null)}
        onDismiss={() => setErrorMessage(null)}
      />

      {acting && (
        <View className="absolute inset-0 items-center justify-center bg-black/20">
          <Loading color="#6ADE50" />
        </View>
      )}
    </>
  );
}
