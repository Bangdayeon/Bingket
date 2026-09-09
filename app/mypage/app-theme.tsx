import { PageHeader } from '@/components/PageHeader';
import CheckIcon from '@/assets/icons/ic_check.svg';
// import { setAppIcon, getAppIcon } from 'expo-dynamic-app-icon';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { applyAppTheme, loadAppTheme, saveAppTheme, type AppTheme } from '@/lib/app-theme';
import { FIXED, useColors } from '@/lib/use-colors';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// type IconTheme = '기본' | '네온' | '노을' | '태닝';

// 미리보기 반원은 라이트/다크 견본을 동시에 보여야 하므로 테마를 따라가면 안 된다.
const APP_THEMES: { value: AppTheme; label: string; leftBg: string; rightBg: string }[] = [
  { value: 'system', label: '시스템', leftBg: FIXED.preview.dark, rightBg: FIXED.preview.light },
  { value: 'light', label: '라이트', leftBg: FIXED.preview.light, rightBg: FIXED.preview.light },
  { value: 'dark', label: '다크', leftBg: FIXED.preview.dark, rightBg: FIXED.preview.dark },
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

// const ICON_THEME_STORAGE_KEY = '@bingket/icon-theme';

export default function AppThemeScreen() {
  const insets = useSafeAreaInsets();
  const [appTheme, setAppTheme] = useState<AppTheme>('system');
  const colors = useColors();

  useEffect(() => {
    void loadAppTheme().then(setAppTheme);

    // const currentIconName: string = getAppIcon();
    // const matched = ICON_THEMES.find((t) => t.iconName === currentIconName);
    // if (matched) setIconTheme(matched.value);
  }, []);

  const handleThemeChange = (theme: AppTheme) => {
    setAppTheme(theme);
    applyAppTheme(theme);
    void saveAppTheme(theme);
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
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title="앱 테마" />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* 앱 테마 */}
        <View className="px-4 pt-6 pb-4">
          {APP_THEMES.map(({ value, label, leftBg, rightBg }) => (
            <Pressable
              key={value}
              onPress={() => handleThemeChange(value)}
              className="h-[52px] flex-row items-center gap-3"
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 9999,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: colors.gray[300],
                  flexDirection: 'row',
                }}
              >
                <View style={{ flex: 1, backgroundColor: leftBg }} />
                <View style={{ flex: 1, backgroundColor: rightBg }} />
              </View>
              <Text className="flex-1 text-body-md">{label}</Text>
              {appTheme === value && (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-green-400">
                  <CheckIcon width={16} height={16} className="text-on-brand" />
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
