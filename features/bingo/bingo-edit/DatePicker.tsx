import DateTimePicker from '@react-native-community/datetimepicker';
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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
        onPress={onDismiss}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#FDFDFD' /* white */,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 20,
          paddingBottom: bottomInset + 16,
          paddingTop: 16,
        }}
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
            textColor="#181C1C"
            minimumDate={minimumDate}
          />
        </View>
      </View>
    </Modal>
  );
}
