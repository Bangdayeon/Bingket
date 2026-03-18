import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, Text, View } from 'react-native';

interface DatePickerProps {
  target: 'start' | 'end';
  tempDate: Date;
  startDate: Date | null;
  bottomInset: number;
  onDateChange: (date: Date) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function DatePicker({
  target,
  tempDate,
  startDate,
  bottomInset,
  onDateChange,
  onConfirm,
  onDismiss,
}: DatePickerProps) {
  return (
    <>
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
        onPress={onDismiss}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 20,
          paddingBottom: bottomInset + 16,
          paddingTop: 16,
          zIndex: 11,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Text className="text-body-sm text-gray-500">
            {target === 'start' ? '시작일' : '종료일'} 선택
          </Text>
          <Pressable onPress={onConfirm}>
            <Text className="text-body-sm text-green-500 font-semibold">확인</Text>
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
            minimumDate={target === 'end' && startDate ? startDate : undefined}
          />
        </View>
      </View>
    </>
  );
}
