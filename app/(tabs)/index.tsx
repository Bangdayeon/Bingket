import HeaderTabBar from '@/components/common/HeaderTabbar';
import RecordTab from '@/components/page/home/RecordTab';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddIcon from '@/assets/icons/ic_add.svg';

export default function HomeScreen() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <SafeAreaView className="relative flex-1 bg-white">
      <HeaderTabBar menus={['전체', '기록']} onTabChange={setTabIndex} />
      {tabIndex === 0 ? (
        <View className="p-5 h-full pt-[60px]">
          <Pressable
            onPress={() => router.push('/bingo-add')}
            className="items-center flex flex-col gap-3 bg-green-100 w-full h-[230px] justify-center rounded-[30px]"
          >
            <Text className="text-title-md">새로운 빙고를 만들어 볼까요?</Text>
            <AddIcon className="w-10 h-10" />
          </Pressable>
        </View>
      ) : (
        <View className="flex-1 pt-[60px]">
          <RecordTab />
        </View>
      )}
    </SafeAreaView>
  );
}
