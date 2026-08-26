import { HeaderTabBar } from '@/components/HeaderTabbar';
import { BingoAll } from '@/features/bingo/BingoAll';
import { BingoTeam } from '@/features/bingo/BingoTeam';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AddIcon from '@/assets/icons/ic_add.svg';
import IconButton from '@/components/IconButton';

export default function HomeScreen() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setTabIndex(0);
    }, []),
  );

  const handleTabChange = (index: number) => {
    setTabIndex(index);
  };

  const addTeamBingo = () => {
    router.push('/bingo/team-mode');
  };

  return (
    <SafeAreaView className="relative flex-1 bg-white" edges={['top']}>
      <HeaderTabBar
        menus={['전체', '함께']}
        onTabChange={handleTabChange}
        selectedIndex={tabIndex}
      />

      {/* 함께 탭 전용 버튼 */}
      {tabIndex === 1 && (
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
      {tabIndex === 1 && <BingoTeam />}
    </SafeAreaView>
  );
}
