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

export function BadgesPage() {
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState<EarnedBadge | null>(null);
  const { contentWidth } = useResponsive();
  const badgeSize = (contentWidth - H_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  const load = useCallback(() => {
    setLoading(true);
    setLoadFailed(false);
    fetchMyBadges()
      .then(setEarned)
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

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
      <ScrollView className="mb-20 flex-1 bg-surface">
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

            <Text className="text-body-sm text-center mt-10" style={{ color: '#B4BBBB' }}>
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
