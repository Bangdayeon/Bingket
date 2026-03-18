import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderTabBarProps {
  menus: string[];
  defaultIndex?: number;
  onTabChange?: (index: number) => void;
}

export default function HeaderTabBar({ menus, defaultIndex = 0, onTabChange }: HeaderTabBarProps) {
  const insets = useSafeAreaInsets();
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
      className="border-b border-gray-300 w-full absolute top-0"
      style={{ paddingTop: insets.top }}
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
              className={`text-title-lg ${selectedIndex === index ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {menu}
            </Text>
          </Pressable>
        ))}
      </View>

      {tabOffsets.length === menus.length && (
        <Animated.View
          style={{ transform: [{ translateX: slideAnim }], bottom: -0.5 }}
          className="absolute w-10 h-[3px] bg-gray-900 rounded-full"
        />
      )}
    </View>
  );
}
