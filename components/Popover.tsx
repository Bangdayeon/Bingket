import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
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
        style={[
          {
            position: 'absolute',
            backgroundColor: '#FDFDFD' /* white */,
            borderRadius: 12,
            minWidth: 144,
            shadowColor: '#000000',
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
            style={[
              { paddingHorizontal: 16, paddingVertical: 12 },
              i < items.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: '#D2D6D6' /* gray-300 */,
              },
            ]}
          >
            <Text
              className="text-body-md"
              style={{ color: item.danger ? '#E02828' /* red-500 */ : '#181C1C' /* gray-900 */ }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
