import { useState } from 'react';
import { Pressable, View } from 'react-native';
import ArrowDownIcon from '@/assets/icons/ic_keyboard_arrow_down.svg';
import { Text } from './Text';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  options: DropdownOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** 선택된 값이 없을 때 보여 줄 문구 */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 시안 Dropdown: 닫힘은 높이 40 / radius 12 / white 배경, 왼쪽 여백 12·오른쪽 여백 8.
 * 열리면 헤더에 gray-300 테두리가 생기고 위쪽 모서리만 둥글어지며,
 * 목록이 그 아래에 겹쳐 뜬다. 목록 항목은 body-sm / gray-800, 간격 8.
 */
export function Dropdown<T extends string>({
  options,
  value,
  onChange,
  placeholder = '선택',
  disabled = false,
  className = '',
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className={`relative ${className}`} style={{ zIndex: open ? 10 : undefined }}>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className={`h-10 flex-row items-center justify-between bg-white py-2 pl-3 pr-2 ${
          open ? 'rounded-t-xl border border-b-0 border-gray-300' : 'rounded-xl'
        } ${disabled ? 'opacity-40' : ''}`}
      >
        <Text
          className={`text-body-md ${
            open ? 'font-pretendard-medium' : ''
          } ${selected ? 'text-gray-900' : 'text-gray-500'}`}
        >
          {selected?.label ?? placeholder}
        </Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ArrowDownIcon width={24} height={24} color="#6E7575" /* gray-600 */ />
        </View>
      </Pressable>

      {open && (
        <View className="absolute left-0 right-0 top-10 gap-2 rounded-b-xl border border-t-0 border-gray-300 bg-white px-3 py-2">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="py-0.5"
            >
              <Text className="text-body-sm text-gray-800">{option.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
