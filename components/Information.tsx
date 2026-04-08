import { useRef, useState } from 'react';
import { Modal, Pressable, View, useColorScheme } from 'react-native';
import IcInfo from '@/assets/icons/ic_info.svg';
import { Text } from '@/components/Text';

interface InformationProps {
  content: React.ReactNode;
}

export function Information({ content }: InformationProps) {
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const iconRef = useRef<View>(null);
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#E5E7EB' /* gray-200 */ : '#1F2937'; /* gray-800 */

  const handlePress = () => {
    iconRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setVisible(true);
    });
  };

  return (
    <>
      <Pressable ref={iconRef} onPress={handlePress} hitSlop={8}>
        <IcInfo width={20} height={20} color={iconColor} />
      </Pressable>

      <Modal transparent visible={visible} onRequestClose={() => setVisible(false)}>
        <Pressable className="flex-1" onPress={() => setVisible(false)}>
          <View
            className="bg-white rounded-lg border border-gray-300 px-3 py-2 absolute"
            style={{
              top: anchor.y + anchor.height + 4,
              left: anchor.x - 12,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text className="text-caption-md">{content}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
