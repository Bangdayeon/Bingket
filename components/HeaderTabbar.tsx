import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderTabBarProps {
  menus: string[];
  defaultIndex?: number;
  selectedIndex?: number;
  onTabChange?: (index: number) => void;
}

export function HeaderTabBar({
  menus,
  defaultIndex = 0,
  selectedIndex: externalIndex,
  onTabChange,
}: HeaderTabBarProps) {
  const insets = useSafeAreaInsets();
  const [selectedIndex, setSelectedIndex] = useState(externalIndex ?? defaultIndex);
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabOffsets, setTabOffsets] = useState<number[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== selectedIndex) {
      setSelectedIndex(externalIndex);
    }
  }, [externalIndex]);

  useEffect(() => {
    if (tabOffsets.length > 0 && tabOffsets[selectedIndex] !== undefined) {
      Animated.spring(slideAnim, {
        toValue: tabOffsets[selectedIndex] + (tabWidths[selectedIndex] - 40) / 2,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    }
  }, [selectedIndex, tabOffsets, tabWidths]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onTabChange?.(index);
  };

  const TAB_BUTTON_HEIGHT = 60; // 버튼 영역 높이 60px
  const TOTAL_HEIGHT = TAB_BUTTON_HEIGHT + insets.top; // safe area 포함 전체 높이

  return (
    <View
      className="bg-white   border-b border-gray-300   w-full absolute top-0"
      style={{ height: TOTAL_HEIGHT, paddingTop: insets.top, zIndex: 50 }}
    >
      <View className="flex-row h-[60px] items-center">
        {menus.map((menu, index) => (
          <Pressable
            key={menu}
            onPress={() => handleSelect(index)}
            className="px-4"
            style={{ height: TAB_BUTTON_HEIGHT, justifyContent: 'center' }}
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
              className="text-title-lg font-pretendard-semibold"
              style={{
                color: selectedIndex === index ? '#181C1C' : '#929898',
              }}
            >
              {menu}
            </Text>
          </Pressable>
        ))}
      </View>

      {tabOffsets.length === menus.length && (
        <Animated.View
          style={{ transform: [{ translateX: slideAnim }], bottom: -0.5 }}
          className="absolute w-10 h-[3px] bg-gray-900   rounded-full"
        />
      )}
    </View>
  );
}
