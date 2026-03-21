import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, useColorScheme } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderTabBarProps {
  menus: string[];
  defaultIndex?: number;
  onTabChange?: (index: number) => void;
}

export function HeaderTabBar({ menus, defaultIndex = 0, onTabChange }: HeaderTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabOffsets, setTabOffsets] = useState<number[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabOffsets.length > 0) {
      Animated.spring(slideAnim, {
        toValue: tabOffsets[selectedIndex] + (tabWidths[selectedIndex] - 40) / 2,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    }
  }, [selectedIndex, tabOffsets]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onTabChange?.(index);
  };

  return (
    <View
      className="bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 w-full absolute top-0"
      style={{ paddingTop: insets.top, zIndex: 50 }}
    >
      <View className="flex-row">
        {menus.map((menu, index) => (
          <Pressable
            key={menu}
            onPress={() => handleSelect(index)}
            className="px-4 py-3"
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              setTabWidths((prev) => {
                const next = [...prev];
                next[index] = width;
                return next;
              });
              setTabOffsets((prev) => {
                const next = [...prev];
                next[index] = x;
                return next;
              });
            }}
          >
            <Text
              className="text-title-lg"
              style={{
                color: selectedIndex === index ? (isDark ? '#F6F7F7' : '#181C1C') : '#929898',
              }} // active: gray-100/gray-900, inactive: gray-500
            >
              {menu}
            </Text>
          </Pressable>
        ))}
      </View>

      {tabOffsets.length === menus.length && (
        <Animated.View
          style={{ transform: [{ translateX: slideAnim }], bottom: -0.5 }}
          className="absolute w-10 h-[3px] bg-gray-900 dark:bg-gray-100 rounded-full"
        />
      )}
    </View>
  );
}
