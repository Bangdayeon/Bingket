import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgProps } from 'react-native-svg';
import { useEffect } from 'react';
import { useUnreadNotifications } from '@/features/notifications/unread-context';

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

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const activeTabName = state.routes[state.index].name;
  const { hasUnread, refresh } = useUnreadNotifications();
  const insets = useSafeAreaInsets();

  // 탭 전환 시마다 재조회
  useEffect(() => {
    refresh();
  }, [activeTabName, refresh]);

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#FDFDFD', // white
        // 상단 모서리가 둥글어서 테두리를 위/좌/우에 둘러야 곡선을 따라간다.
        // borderTopWidth만 주면 곡선 구간에서 선이 끊긴다.
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#E8EAEA', // gray-200
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // 탭을 flex로 균등 분배하지 않는다. 좌우 60을 비우고 나머지를 space-between으로
        // 벌린다 — 시안의 아이콘 위치가 이 방식이라야 맞는다.
        justifyContent: 'space-between',
        paddingHorizontal: 60,
        paddingTop: 10,
        paddingBottom: insets.bottom + 6,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = TAB_ICONS[route.name];
        const Icon = tab ? (isFocused ? tab.on : tab.off) : null;
        const isNotifications = route.name === 'notifications';
        const color = isFocused ? '#181C1C' : '#6E7575'; // gray-900 / gray-600

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
            <View
              style={{
                width: 28,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {Icon && <Icon width={28} height={28} color={color} />}
              {isNotifications && hasUnread && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#E02828', // red-500
                  }}
                />
              )}
            </View>
            {/* lineHeight를 폰트 크기에 붙여 아이콘과의 간격을 gap으로만 통제한다.
                20을 주면 글자 위아래로 4px씩 빈 공간이 더 생겨 간격이 흐려진다. */}
            <Text style={{ fontSize: 12, lineHeight: 14, color, fontFamily: 'pretendard' }}>
              {tab?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
