import { HeaderTabBar } from '@/components/HeaderTabbar';
import { BingoAll } from '@/features/bingo/BingoAll';
import { BingoHistory } from '@/features/bingo/BingoHistory';
import { BingoTeam } from '@/features/bingo/BingoTeam';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AddIcon from '@/assets/icons/ic_add.svg';
import IconButton from '@/components/IconButton';

export default function HomeScreen() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setTabIndex(0);
    }, []),
  );

  const handleTabChange = (index: number) => {
    setTabIndex(index);
    if (index !== 1) setIsReorderMode(false);
  };

  const addTeamBingo = () => {
    router.push('/bingo/team-mode');
  };

  const reorderIconColor = isReorderMode ? '#181C1C' /* gray-900 */ : '#B4BBBB'; /* gray-400 */

  return (
    <SafeAreaView className="relative flex-1 bg-white" edges={['top']}>
      <HeaderTabBar
        menus={['전체', '기록', '함께']}
        onTabChange={handleTabChange}
        selectedIndex={tabIndex}
      />

      {/* 기록 탭 전용 순서 변경 버튼 (HeaderTabBar 위에 올림) */}
      {tabIndex === 1 && (
        <Pressable
          onPress={() => setIsReorderMode((prev) => !prev)}
          style={{
            position: 'absolute',
            top: insets.top + 16,
            right: 16,
            zIndex: 51,
            padding: 6,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={{ gap: 4 }}>
            <View
              style={{ width: 18, height: 2, borderRadius: 2, backgroundColor: reorderIconColor }}
            />
            <View
              style={{ width: 14, height: 2, borderRadius: 2, backgroundColor: reorderIconColor }}
            />
            <View
              style={{ width: 18, height: 2, borderRadius: 2, backgroundColor: reorderIconColor }}
            />
          </View>
        </Pressable>
      )}

      {/* 함께 탭 전용 버튼 */}
      {tabIndex === 2 && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 8,
            right: 16,
            zIndex: 51,
          }}
        >
          <IconButton
            variant="ghost"
            icon={<AddIcon width={24} height={24} />}
            onClick={addTeamBingo}
          />
        </View>
      )}

      {tabIndex === 0 && <BingoAll />}
      {tabIndex === 1 && <BingoHistory isReorderMode={isReorderMode} />}
      {tabIndex === 2 && <BingoTeam />}
    </SafeAreaView>
  );
}
