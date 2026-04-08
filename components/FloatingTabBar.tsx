import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppState, Platform, useColorScheme, View } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

import HomeOff from '@/assets/icons/home_off.svg';
import HomeOn from '@/assets/icons/home_on.svg';
import CommunityOff from '@/assets/icons/community_off.svg';
import CommunityOn from '@/assets/icons/community_on.svg';
import AlertOff from '@/assets/icons/alert_off.svg';
import AlertOn from '@/assets/icons/alert_on.svg';
import MypageOff from '@/assets/icons/mypage_off.svg';
import MypageOn from '@/assets/icons/mypage_on.svg';
import IconButton from './IconButton';

const TAB_ICONS: Record<string, { on: React.FC<SvgProps>; off: React.FC<SvgProps> }> = {
  index: { on: HomeOn, off: HomeOff },
  community: { on: CommunityOn, off: CommunityOff },
  notifications: { on: AlertOn, off: AlertOff },
  mypage: { on: MypageOn, off: MypageOff },
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const activeTabName = state.routes[state.index].name;
  const hasUnread = useUnreadNotifications(activeTabName);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 28,
        left: 24,
        right: 24,
        height: 64,
        backgroundColor: isDark ? '#4C5252' : '#ffffff',
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        ...Platform.select({
          ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
          },
          android: { elevation: 16 },
        }),
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const icons = TAB_ICONS[route.name];
        const Icon = isFocused ? icons?.on : icons?.off;
        const isNotifications = route.name === 'notifications';

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
          <IconButton
            key={route.key}
            variant="ghost"
            active={isFocused}
            onClick={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            icon={
              Icon ? (
                <View>
                  <Icon width={24} height={24} color={isFocused ? '#6ADE50' : '#929898'} />
                  {isNotifications && hasUnread && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#E02828',
                      }}
                    />
                  )}
                </View>
              ) : null
            }
          />
        );
      })}
    </View>
  );
}
