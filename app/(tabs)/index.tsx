import { HeaderTabBar } from '@/components/HeaderTabbar';
import { BingoAll } from '@/features/bingo/BingoAll';
import { BingoBattle } from '@/features/bingo/BingoBattle';
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

  const addBattle = () => {
    router.push('/bingo/battle');
  };

  return (
    <SafeAreaView className="relative flex-1 bg-white" edges={['top']}>
      <HeaderTabBar
        menus={['전체', '대결']}
        onTabChange={handleTabChange}
        selectedIndex={tabIndex}
      />

      {/* 대결 탭 전용 버튼 */}
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
            onClick={addBattle}
          />
        </View>
      )}

      {tabIndex === 0 && <BingoAll />}
      {tabIndex === 1 && <BingoBattle />}
    </SafeAreaView>
  );
}
