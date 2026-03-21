import '@/global.css';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    AsyncStorage.getItem('@bingkit/app-theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        Appearance.setColorScheme(saved);
      } else {
        Appearance.setColorScheme('unspecified');
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/add" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/modify" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/view" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/profile-edit" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/account" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/alert-setting" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/app-theme" options={{ headerShown: false }} />
        <Stack.Screen name="community/search" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
