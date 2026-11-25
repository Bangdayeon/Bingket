import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgProps } from 'react-native-svg';
import { CoachMarkTarget } from '@/features/coachmark/CoachMarkTarget';
import type { CoachMarkTargetId } from '@/features/coachmark/lib/coach-mark-steps';
import { TABLET_MAX_CONTENT_WIDTH } from '@/lib/use-responsive';
import HomeOff from '@/assets/icons/home_off.svg';
import HomeOn from '@/assets/icons/home_on.svg';
import CommunityOff from '@/assets/icons/ic_community_off.svg';
import CommunityOn from '@/assets/icons/ic_community_on.svg';
import MypageOff from '@/assets/icons/mypage_off.svg';
import MypageOn from '@/assets/icons/mypage_on.svg';
import { useTranslation } from 'react-i18next';

// onboarding mark id
const TAB_COACH_MARK_IDS: Record<string, CoachMarkTargetId> = {
  index: 'tab-home',
  community: 'tab-community',
  mypage: 'tab-mypage',
};

const DESIGN_WIDTH = 390;
const DESIGN_H_PADDING = 60;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const TAB_ICONS: Record<
    string,
    { on: React.FC<SvgProps>; off: React.FC<SvgProps>; label: string }
  > = {
    index: { on: HomeOn, off: HomeOff, label: t('common.screen.home') },
    // community: { on: CommunityOn, off: CommunityOff, label: t('common.screen.board') },
    bingos: { on: CommunityOn, off: CommunityOff, label: t('common.screen.bingos') },
    mypage: { on: MypageOn, off: MypageOff, label: t('common.screen.mypage') },
  };

  const horizontalPadding =
    (Math.min(width, TABLET_MAX_CONTENT_WIDTH) * DESIGN_H_PADDING) / DESIGN_WIDTH;

  return (
    <View className="bg-surface">
      <View
        className="flex-row border-t border-gray-200 bg-white"
        style={{
          flexDirection: 'row',
          gap: 20,
          paddingHorizontal: horizontalPadding,
          paddingTop: 6,
          paddingBottom: insets.bottom + 2,
        }}
      >
        {state.routes
          .filter((route) => route.name !== 'community')
          .map((route) => {
            const index = state.routes.findIndex((item) => item.key === route.key);
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const tab = TAB_ICONS[route.name];
            const Icon = tab ? (isFocused ? tab.on : tab.off) : null;
            const labelClass = isFocused ? 'text-gray-800' : 'text-gray-600';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                style={{ alignItems: 'center', gap: 2 }}
                hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
                onPress={onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
              >
                <CoachMarkTarget id={TAB_COACH_MARK_IDS[route.name]}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {Icon && <Icon width={28} height={28} className={labelClass} />}
                  </View>
                </CoachMarkTarget>
                <Text className={`text-caption-sm font-pretendard ${labelClass}`}>
                  {tab?.label}
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
}
