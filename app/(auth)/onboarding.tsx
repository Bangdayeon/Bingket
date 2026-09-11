import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Image, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Dot } from '@/features/onboarding/Dot';

import onboarding1 from '@/assets/onboarding/onboarding_1.png';
import onboarding2 from '@/assets/onboarding/onboarding_2.png';
import onboarding3 from '@/assets/onboarding/onboarding_3.png';
import onboarding4 from '@/assets/onboarding/onboarding_4.png';
import onboarding5 from '@/assets/onboarding/onboarding_5.png';

import { useTranslation } from 'react-i18next';

const goToLogin = async () => {
  await AsyncStorage.setItem('@bingket/onboarding-seen', '1');
  router.replace('/(auth)/login');
};

const CARD_MAX_WIDTH = 358;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const slides = [
    { id: '1', title: t('onboarding.msg1'), img: onboarding1 },
    { id: '2', title: t('onboarding.msg2'), img: onboarding2 },
    { id: '3', title: t('onboarding.msg3'), img: onboarding3 },
    { id: '4', title: t('onboarding.msg4'), img: onboarding4 },
    { id: '5', title: t('onboarding.msg5'), img: onboarding5 },
  ];

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cardWidth = Math.min(width - 32, isTablet ? 560 : CARD_MAX_WIDTH);
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
            <View className="flex-1 items-center pt-7" style={{ width: cardWidth }}>
              <Text className="px-6 text-center text-title-sm text-gray-800">{item.title}</Text>

              <Image source={item.img} style={{ width: cardWidth, flex: 1 }} resizeMode="contain" />
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

        <Button
          label={isLast ? t('common.start') : t('common.next')}
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
