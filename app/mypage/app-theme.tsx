import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { setAppIcon, getAppIcon } from 'expo-dynamic-app-icon';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Appearance, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AppTheme = 'system' | 'light' | 'dark';
// type IconTheme = '기본' | '네온' | '노을' | '태닝';

const APP_THEMES: { value: AppTheme; label: string; leftBg: string; rightBg: string }[] = [
  {
    value: 'system',
    label: '시스템',
    leftBg: '#181C1C',
    rightBg: '#FDFDFD',
  } /* gray-900 : white */,
  { value: 'light', label: '라이트', leftBg: '#FDFDFD', rightBg: '#FDFDFD' } /* white : white */,
  { value: 'dark', label: '다크', leftBg: '#181C1C', rightBg: '#181C1C' } /* gray-900 : gray-900 */,
];

// const ICON_THEMES: { value: IconTheme; iconName: string; image: number }[] = [
//   {
//     value: '기본',
//     iconName: 'default',
//     image: require('@/assets/icon_themes/icon_theme_default.png'),
//   },
//   { value: '네온', iconName: 'neon', image: require('@/assets/icon_themes/icon_theme_neon.png') },
//   {
//     value: '노을',
//     iconName: 'sunset',
//     image: require('@/assets/icon_themes/icon_theme_sunset.png'),
//   },
//   {
//     value: '태닝',
//     iconName: 'tanning',
//     image: require('@/assets/icon_themes/icon_theme_tanning.png'),
//   },
// ];

const THEME_STORAGE_KEY = '@bingket/app-theme';
// const ICON_THEME_STORAGE_KEY = '@bingket/icon-theme';

function applyTheme(theme: AppTheme) {
  Appearance.setColorScheme((theme === 'system' ? null : theme) as unknown as 'light' | 'dark');
}

export default function AppThemeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [appTheme, setAppTheme] = useState<AppTheme>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setAppTheme(saved);
      }
    });

    // const currentIconName: string = getAppIcon();
    // const matched = ICON_THEMES.find((t) => t.iconName === currentIconName);
    // if (matched) setIconTheme(matched.value);
  }, []);

  const handleThemeChange = (theme: AppTheme) => {
    setAppTheme(theme);
    applyTheme(theme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  // const handleIconThemeChange = async (value: IconTheme) => {
  //   setIconTheme(value);
  //   const selected = ICON_THEMES.find((t) => t.value === value);
  //   if (selected) {
  //     await setAppIcon(selected.iconName);
  //     await AsyncStorage.setItem(ICON_THEME_STORAGE_KEY, selected.iconName);
  //   }
  // };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300 dark:border-gray-700">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">앱 테마</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* 앱 테마 */}
        <View className="px-5 pt-6 pb-4">
          <Text className="text-title-md mb-4">앱 테마</Text>
          {APP_THEMES.map(({ value, label, leftBg, rightBg }) => (
            <Pressable
              key={value}
              onPress={() => handleThemeChange(value)}
              className="flex-row items-center gap-3 py-2"
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#B4BBBB' /* gray-400 */,
                  flexDirection: 'row',
                }}
              >
                <View style={{ flex: 1, backgroundColor: leftBg }} />
                <View style={{ flex: 1, backgroundColor: rightBg }} />
              </View>
              <Text className="flex-1 text-body-md">{label}</Text>
              {appTheme === value && (
                <View className="w-5 h-5 rounded-full bg-green-500 items-center justify-center">
                  <View className="w-2 h-2 rounded-full bg-white" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* 아이콘 테마 */}
        {/* <View className="px-5 pt-6">
          <Text className="text-title-md mb-4">아이콘 테마</Text>
          {ICON_THEMES.map(({ value, image }) => (
            <Pressable
              key={value}
              onPress={() => handleIconThemeChange(value)}
              className="flex-row items-center gap-3 py-2"
            >
              <Image source={image} style={{ width: 60, height: 60, borderRadius: 12 }} />
              <Text className="flex-1 text-body-md">{value}</Text>
              {iconTheme === value && (
                <View className="w-5 h-5 rounded-full bg-green-500 items-center justify-center">
                  <View className="w-2 h-2 rounded-full bg-white" />
                </View>
              )}
            </Pressable>
          ))}
        </View> */}
      </ScrollView>
    </View>
  );
}
