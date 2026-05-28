import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppState, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgProps } from 'react-native-svg';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  community: { on: CommunityOn, off: CommunityOff, label: '라운지' },
  notifications: { on: BellOn, off: BellOff, label: '알림' },
  mypage: { on: MypageOn, off: MypageOff, label: '내 정보' },
};

function useUnreadNotifications(activeTabName: string) {
  const [hasUnread, setHasUnread] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const fetchUnread = async () => {
    if (!userIdRef.current) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;
    }
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userIdRef.current)
      .eq('is_read', false);
    setHasUnread((count ?? 0) > 0);
  };

  // 앱 시작 시 1회
  useEffect(() => {
    fetchUnread();
  }, []);

  // 탭 전환 시마다 재조회
  useEffect(() => {
    fetchUnread();
  }, [activeTabName]);

  // 앱 포그라운드 복귀 시 재조회
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchUnread();
    });
    return () => sub.remove();
  }, []);

  return hasUnread;
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const activeTabName = state.routes[state.index].name;
  const hasUnread = useUnreadNotifications(activeTabName);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#D2D6D6', // gray-300
        paddingBottom: insets.bottom,
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
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          >
            <View
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {Icon && <Icon width={24} height={24} color={color} />}
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
            <Text style={{ fontSize: 12, lineHeight: 20, color, fontFamily: 'pretendard' }}>
              {tab?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
