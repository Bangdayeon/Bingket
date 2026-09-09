import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Image, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Dot } from '@/features/onboarding/Dot';

import onboarding1 from '@/assets/onboarding/onboarding_1.png';
import onboarding2 from '@/assets/onboarding/onboarding_2.png';
import onboarding3 from '@/assets/onboarding/onboarding_3.png';
import onboarding4 from '@/assets/onboarding/onboarding_4.png';
import onboarding5 from '@/assets/onboarding/onboarding_5.png';

// 시안 문구 그대로 (마침표 없음). 4번은 시안에 프레임이 없어 기존 문구를 다듬어 유지한다.
const slides = [
  { id: '1', title: '이루기 어려웠던 목표를\n빙고판에 채워봐요', img: onboarding1 },
  { id: '2', title: '혼자서 의지가 안 생긴다면\n친구와 가족과 함께해요', img: onboarding2 },
  { id: '3', title: '사람들과 목표를 공유하고\n서로의 도전을 응원해요', img: onboarding3 },
  { id: '4', title: '차근차근 목표를 이뤄나가며\n뱃지를 수집해요', img: onboarding4 },
  {
    id: '5',
    title: '빙고에 채우는 나만의 도전,\n빙킷에서 시작해봐요',
    img: onboarding5,
    isLast: true,
  },
];

const goToLogin = async () => {
  await AsyncStorage.setItem('@bingket/onboarding-seen', '1');
  router.replace('/(auth)/login');
};

// 시안: 카드 358×480, 좌우 여백 16, 상단 136, 문구는 카드 상단에서 28.
const CARD_MAX_WIDTH = 358;
const CARD_HEIGHT = 480;

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cardWidth = Math.min(width - 32, isTablet ? 560 : CARD_MAX_WIDTH);
  const cardHeight = Math.round(cardWidth * (CARD_HEIGHT / CARD_MAX_WIDTH));
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
    <SafeAreaView className="flex-1 bg-surface">
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 items-center pt-[100px]">
            <View
              className="items-center rounded-[20px] bg-white px-6 pt-7"
              style={{ width: cardWidth, height: cardHeight }}
            >
              <Text className="text-center text-body-md text-gray-800">{item.title}</Text>

              {item.isLast ? (
                // 마지막 슬라이드는 일러스트 대신 로고 + 워드마크
                <View className="flex-1 items-center justify-center">
                  <Logo size={150} />
                  <Text
                    className="mt-5 font-pretendard-bold text-green-500"
                    style={{ fontSize: 48, lineHeight: 48 }}
                  >
                    빙킷
                  </Text>
                </View>
              ) : (
                <Image
                  source={item.img}
                  style={{ width: cardWidth - 48, flex: 1 }}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        )}
      />

      <View className="items-center pb-9">
        <View className="mb-10 flex-row items-center gap-3">
          {slides.map((_, index) => (
            <Dot key={index} active={currentIndex === index} onPress={() => scrollToIndex(index)} />
          ))}
        </View>

        {/* 시안의 버튼은 내용에 맞춰 줄어드는 폭이다 */}
        <Button
          label={isLast ? '시작하기' : '다음'}
          className="px-6"
          onClick={() => {
            if (isLast) {
              void goToLogin();
            } else {
              scrollToIndex(currentIndex + 1);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
