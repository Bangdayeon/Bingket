import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, View } from 'react-native';
import { Text } from '@/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Dot } from '@/features/onboarding/Dot';
import IconButton from '@/components/IconButton';
import CloseIcon from '@/assets/icons/ic_close.svg';
import { Image } from 'react-native';

import onboarding1 from '@/assets/onboarding/onboarding_1.png';
import onboarding2 from '@/assets/onboarding/onboarding_2.png';
import onboarding3 from '@/assets/onboarding/onboarding_3.png';
import onboarding4 from '@/assets/onboarding/onboarding_4.png';
import onboarding5 from '@/assets/onboarding/onboarding_5.png';

const { width } = Dimensions.get('window');

const slides = [
  { id: '1', title: '이루기 어려웠던 목표를\n빙고판 위에 작성해봐요.', img: onboarding1 },
  { id: '2', title: '혼자서 하기 어렵다면\n친구와 함께 해요.', img: onboarding2 },
  { id: '3', title: '사람들과 목표를 공유하고\n서로의 도전을 응원해요.', img: onboarding3 },
  { id: '4', title: '차근차근 목표를 이뤄나가며\n뱃지를 수집해요.', img: onboarding4 },
  { id: '5', title: '빙고로 채우는 나만의 도전,\n빙킷에서 시작해요.', img: onboarding5 },
];

const goToLogin = async () => {
  await AsyncStorage.setItem('@bingket/onboarding-seen', '1');
  router.replace('/(auth)/login');
};

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* 우측 상단 X 버튼 */}
      <View className="absolute top-10 right-0 z-10 p-4">
        <IconButton variant="ghost" icon={<CloseIcon />} onClick={goToLogin} />
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 items-center justify-center px-5 gap-5">
            <Image source={item.img} style={{ width: 340, height: 464 }} resizeMode="contain" />
            <Text className="text-title-md text-center">{item.title}</Text>
          </View>
        )}
      />

      <View className="items-center pb-5">
        <View className="flex-row items-center gap-2 mb-8">
          {slides.map((_, index) => (
            <Dot key={index} active={currentIndex === index} onPress={() => scrollToIndex(index)} />
          ))}
        </View>

        <Button
          label={isLast ? '시작하기' : '다음'}
          onClick={() => {
            if (isLast) {
              void goToLogin();
            } else {
              scrollToIndex(currentIndex + 1);
            }
          }}
          style={{ width: width - 40 }}
        />
      </View>
    </SafeAreaView>
  );
}
