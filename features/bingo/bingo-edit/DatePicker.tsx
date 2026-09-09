import DateTimePicker from '@react-native-community/datetimepicker';
import { useColors } from '@/lib/use-colors';
import { Modal, Platform, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';

interface DatePickerProps {
  target: 'start' | 'end';
  tempDate: Date;
  startDate: Date | null;
  bottomInset: number;
  onDateChange: (date: Date) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function DatePicker({
  target,
  tempDate,
  startDate,
  bottomInset,
  onDateChange,
  onConfirm,
  onDismiss,
}: DatePickerProps) {
  const colors = useColors();
  const minimumDate = target === 'end' && startDate ? startDate : undefined;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={tempDate}
        mode="date"
        display="default"
        onChange={(event, date) => {
          if (event.type === 'dismissed') {
            onDismiss();
          } else if (date) {
            onDateChange(date);
            onConfirm();
          }
        }}
        minimumDate={minimumDate}
      />
    );
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        className="absolute bottom-0 left-0 right-0 top-0 bg-scrim/30"
        onPress={onDismiss}
      />
      <View
        className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white px-5 pt-4"
        style={{ paddingBottom: bottomInset + 16 }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-body-sm text-gray-500">
            {target === 'start' ? '시작일' : '종료일'} 선택
          </Text>
          <Pressable onPress={onConfirm}>
            <Text className="text-body-sm text-green-500 font-pretendard-semibold">확인</Text>
          </Pressable>
        </View>
        <View style={{ height: 216 }}>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            onChange={(_, date) => {
              if (date) onDateChange(date);
            }}
            locale="ko-KR"
            style={{ flex: 1 }}
            textColor={colors.gray[900]}
            minimumDate={minimumDate}
          />
        </View>
      </View>
    </Modal>
  );
}
