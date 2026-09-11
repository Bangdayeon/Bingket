import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';
import { BadgeModal } from './components/BadgeModal';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import * as Sentry from '@sentry/react-native';
import { useResponsive } from '@/lib/use-responsive';

interface EarnedBadge {
  badgeId: string;
  iconUrl: string;
  name: string;
  earnedAt: string;
}

const TOTAL_BADGES = 16;
const COLUMNS = 3;
// 시안: 좌우 16, 열 간격 11 → 390 화면에서 112px 세 칸
const H_PADDING = 16;
const GAP = 11;

/** 내 뱃지. user_badges 의 RLS("본인만")가 그대로 통하는 경로다. */
async function fetchMyBadges(): Promise<EarnedBadge[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at, badges ( name, icon_url )')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: true });

  // 조회 실패를 빈 배열로 돌려주면 뱃지가 하나도 없는 것처럼 보인다.
  if (error) throw error;

  return (data ?? []).map((row) => {
    const badgeRaw = row.badges as unknown;
    const badge = Array.isArray(badgeRaw)
      ? ((badgeRaw[0] as { name: string; icon_url: string | null } | undefined) ?? null)
      : (badgeRaw as { name: string; icon_url: string | null } | null);
    return {
      badgeId: row.badge_id as string,
      iconUrl: (badge?.icon_url as string | undefined) ?? '',
      name: (badge?.name as string | undefined) ?? '',
      earnedAt: row.earned_at as string,
    };
  });
}

/**
 * 타인 뱃지. RLS 가 "본인만"이라 테이블 직접 조회로는 한 줄도 안 나오므로,
 * 계정 공개범위 판정이 들어간 security definer RPC 를 쓴다 (20260909000007).
 * 볼 수 없는 상대면 빈 배열이 온다 — 잠금 표시는 프로필 화면이 account_visibility 로 판단한다.
 *
 * 내 뱃지까지 이 RPC 로 합치지 않은 건 마이그레이션이 원격에 적용되기 전까지
 * 내 공간의 뱃지 탭이 같이 죽는 걸 피하기 위해서다. 배포 뒤에는 합쳐도 된다.
 */
async function fetchOtherBadges(userId: string): Promise<EarnedBadge[]> {
  const { data, error } = await supabase.rpc('get_user_badges', { p_user_id: userId });
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    badgeId: row.badge_id as string,
    iconUrl: (row.icon_url as string | null) ?? '',
    name: (row.name as string | null) ?? '',
    earnedAt: row.earned_at as string,
  }));
}

interface BadgesPageProps {
  /** 비우면 내 뱃지. 타인 프로필에서는 그 사람 id 를 넘긴다. */
  userId?: string;
  /**
   * 하단 여백. 기본은 0이다 — 탭바는 화면과 나란한 flex 형제라 화면 좌표계가
   * 이미 탭바 위에서 끝난다(af04857에서 플로팅 → 고정으로 바뀜). 스택 화면에서
   * 쓸 때만 safe-area를 넘긴다(app/profile/[id].tsx).
   */
  bottomGap?: number;
}

export function BadgesPage({ userId, bottomGap = 0 }: BadgesPageProps = {}) {
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState<EarnedBadge | null>(null);
  const { contentWidth } = useResponsive();
  const badgeSize = (contentWidth - H_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  const load = useCallback(() => {
    setLoading(true);
    setLoadFailed(false);
    (userId ? fetchOtherBadges(userId) : fetchMyBadges())
      .then(setEarned)
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const slots: (EarnedBadge | null)[] = [
    ...earned,
    ...Array<null>(Math.max(0, TOTAL_BADGES - earned.length)).fill(null),
  ];

  // 슬롯을 COLUMNS 단위로 행 분할
  const rows = slots.reduce<(EarnedBadge | null)[][]>((acc, item, i) => {
    if (i % COLUMNS === 0) acc.push([]);
    acc[acc.length - 1].push(item);
    return acc;
  }, []);

  return (
    <>
      <ScrollView className="flex-1 bg-surface" style={{ marginBottom: bottomGap }}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Loading />
          </View>
        ) : loadFailed ? (
          <ErrorState message="뱃지를 불러오지 못했어요" onRetry={load} />
        ) : (
          <View className="py-4">
            {earned.length === 0 && (
              <Text className="mb-6 text-center text-body-md text-gray-500">
                아직 획득한 뱃지가 없어요
              </Text>
            )}
            <View style={{ gap: GAP, paddingHorizontal: H_PADDING }}>
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', gap: GAP }}>
                  {row.map((badge, colIndex) =>
                    badge ? (
                      <Pressable
                        key={badge.badgeId}
                        onPress={() => {
                          setShowBadgeModal(badge);
                        }}
                      >
                        <Image
                          key={badge.badgeId}
                          source={{ uri: badge.iconUrl }}
                          style={{ width: badgeSize, height: badgeSize, borderRadius: 16 }}
                          resizeMode="contain"
                        />
                      </Pressable>
                    ) : (
                      <View
                        key={`empty-${rowIndex}-${colIndex}`}
                        style={{ width: badgeSize, height: badgeSize, borderRadius: 16 }}
                        className="bg-gray-200  "
                      />
                    ),
                  )}
                </View>
              ))}
            </View>

            <Text className="text-body-sm text-center mt-10 text-gray-400">
              더 많은 뱃지가 추가될 예정이에요
            </Text>
          </View>
        )}
      </ScrollView>

      <BadgeModal
        visible={!!showBadgeModal}
        badge={showBadgeModal}
        onClose={() => setShowBadgeModal(null)}
      />
    </>
  );
}
