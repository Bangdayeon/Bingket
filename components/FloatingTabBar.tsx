import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgProps } from 'react-native-svg';
import { useEffect } from 'react';
import { useUnreadNotifications } from '@/features/notifications/unread-context';
import { CoachMarkTarget } from '@/features/coachmark/CoachMarkTarget';
import type { CoachMarkTargetId } from '@/features/coachmark/lib/coach-mark-steps';
import { TABLET_MAX_CONTENT_WIDTH } from '@/lib/use-responsive';

import HomeOff from '@/assets/icons/home_off.svg';
import HomeOn from '@/assets/icons/home_on.svg';
import CommunityOff from '@/assets/icons/ic_community_off.svg';
import CommunityOn from '@/assets/icons/ic_community_on.svg';
import BellOff from '@/assets/icons/ic_bell_off.svg';
import BellOn from '@/assets/icons/ic_bell_on.svg';
import MypageOff from '@/assets/icons/mypage_off.svg';
import MypageOn from '@/assets/icons/mypage_on.svg';

const TAB_ICONS: Record<
  string,
  { on: React.FC<SvgProps>; off: React.FC<SvgProps>; label: string }
> = {
  index: { on: HomeOn, off: HomeOff, label: '홈' },
  community: { on: CommunityOn, off: CommunityOff, label: '게시판' },
  notifications: { on: BellOn, off: BellOff, label: '알림' },
  mypage: { on: MypageOn, off: MypageOff, label: '내 공간' },
};

/**
 * 첫 실행 안내가 가리키는 탭. 알림은 안내 대상이 아니라 빠져 있고, 그래도 래퍼는
 * 네 탭 모두에 똑같이 씌운다 — 하나만 감싸면 그 탭의 레이아웃만 미묘하게 달라진다.
 */
const TAB_COACH_MARK_IDS: Record<string, CoachMarkTargetId> = {
  index: 'tab-home',
  community: 'tab-community',
  mypage: 'tab-mypage',
};

/** 시안이 그려진 화면 폭. 좌우 여백을 이 비율로 환산한다 */
const DESIGN_WIDTH = 390;
const DESIGN_H_PADDING = 60;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const activeTabName = state.routes[state.index].name;
  const { hasUnread, refresh } = useUnreadNotifications();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  /**
   * 좌우 여백을 60으로 고정하면 좁은 기기(320pt)에서 남는 폭이 200pt뿐이라
   * '내 공간' 라벨이 밀린다. 화면 폭에 비례해 줄인다.
   * 태블릿에서는 콘텐츠 최대 폭 기준으로 잘라 아이콘이 양끝으로 벌어지지 않게 한다.
   */
  const horizontalPadding =
    (Math.min(width, TABLET_MAX_CONTENT_WIDTH) * DESIGN_H_PADDING) / DESIGN_WIDTH;

  // 탭 전환 시마다 재조회
  useEffect(() => {
    refresh();
  }, [activeTabName, refresh]);

  return (
    // rounded-t-3xl의 좌우 모서리 삼각형은 투명이라 그 뒤 레이어가 그대로 비친다.
    // 그게 네비게이션 테마의 배경색이면 테마 배선이 어긋날 때 흰 조각이 남으므로,
    // 여기서 직접 칠해 탭바가 남의 색에 기대지 않게 한다.
    <View className="bg-surface">
      <View
        // 상단 모서리가 둥글어서 테두리를 위/좌/우에 둘러야 곡선을 따라간다.
        // borderTopWidth만 주면 곡선 구간에서 선이 끊긴다.
        className="flex-row rounded-t-3xl border-l border-r border-t border-gray-300 bg-white"
        style={{
          flexDirection: 'row',
          // 탭을 flex로 균등 분배하지 않는다. 좌우를 비우고 나머지를 space-between으로
          // 벌린다 — 시안의 아이콘 위치가 이 방식이라야 맞는다.
          justifyContent: 'space-between',
          paddingHorizontal: horizontalPadding,
          paddingTop: 4,
          paddingBottom: insets.bottom + 6,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = TAB_ICONS[route.name];
          const Icon = tab ? (isFocused ? tab.on : tab.off) : null;
          const isNotifications = route.name === 'notifications';
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
              style={{ alignItems: 'center', gap: 6 }}
              // flex를 뺀 만큼 탭 영역이 아이콘+라벨 크기로 줄어든다.
              // 손가락으로 누르기엔 좁아서 터치 범위만 좌우로 넓힌다.
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
                  {isNotifications && hasUnread && (
                    <View
                      className="absolute -right-0.5 -top-0.5 rounded-full bg-danger"
                      style={{ width: 6, height: 6 }}
                    />
                  )}
                </View>
              </CoachMarkTarget>
              {/* lineHeight를 폰트 크기에 붙여 아이콘과의 간격을 gap으로만 통제한다.
                20을 주면 글자 위아래로 4px씩 빈 공간이 더 생겨 간격이 흐려진다. */}
              <Text className={`text-caption-sm font-pretendard ${labelClass}`}>{tab?.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
