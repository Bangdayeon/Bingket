import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { FIXED } from '@/lib/use-colors';
import { Text } from './Text';

export interface PopoverItem {
  label: string;
  onPress: () => void;
  danger?: boolean;
}

interface PopoverProps {
  visible: boolean;
  items: PopoverItem[];
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Popover({ visible, items, onDismiss, style }: PopoverProps) {
  if (!visible) return null;

  return (
    <>
      <Pressable
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10 }}
        onPress={onDismiss}
      />
      <View
        className="bg-white"
        style={[
          {
            position: 'absolute',
            borderRadius: 12,
            minWidth: 144,
            shadowColor: FIXED.fixedBlack,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 5,
            zIndex: 20,
          },
          style,
        ]}
      >
        {items.map((item, i) => (
          <Pressable
            key={item.label}
            onPress={() => {
              onDismiss();
              item.onPress();
            }}
            className={i < items.length - 1 ? 'border-b border-gray-300' : undefined}
            style={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Text className={`text-body-md ${item.danger ? 'text-danger' : 'text-gray-900'}`}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
