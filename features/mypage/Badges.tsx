import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';
import { BadgeModal } from './components/BadgeModal';
import Loading from '@/components/Loading';

interface EarnedBadge {
  badgeId: string;
  iconUrl: string;
  name: string;
  earnedAt: string;
}

const TOTAL_BADGES = 16;
const COLUMNS = 3;
const BADGE_SIZE = 96;
const GAP = 12;

async function fetchMyBadges(): Promise<EarnedBadge[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at, badges ( name, icon_url )')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: true });

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
  const [showBadgeModal, setShowBadgeModal] = useState<EarnedBadge | null>(null);

  useEffect(() => {
    fetchMyBadges().then((data) => {
      setEarned(data);
      setLoading(false);
    });
  }, []);

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
      <ScrollView className="flex-1 mt-[80px] bg-white dark:bg-gray-900 mb-20">
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Loading color="6ADE50" />
          </View>
        ) : (
          <View className="py-4 items-center">
            <View style={{ gap: GAP }}>
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
                          style={{ width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: 12 }}
                          resizeMode="contain"
                        />
                      </Pressable>
                    ) : (
                      <View
                        key={`empty-${rowIndex}-${colIndex}`}
                        style={{ width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: 20 }}
                        className="bg-gray-200 dark:bg-gray-700"
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
