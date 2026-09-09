import { forwardRef } from 'react';
import { Pressable, TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import CloseIcon from '@/assets/icons/ic_close.svg';
import SearchIcon from '@/assets/icons/ic_search.svg';

interface SearchInputProps extends Omit<TextInputProps, 'placeholderTextColor'> {
  /** 지우기 버튼. 넘기지 않으면 버튼 자체를 그리지 않는다. */
  onClear?: () => void;
  className?: string;
}

/**
 * 시안 SearchInput: 높이 48, radius 12, gray-200 배경, 안쪽 여백 12.
 * 돋보기와 입력값 사이 간격은 4, 지우기 버튼은 오른쪽 끝에 붙는다.
 */
export const SearchInput = forwardRef<RNTextInput, SearchInputProps>(function SearchInput(
  { onClear, className = '', value, style, ...rest },
  ref,
) {
  return (
    <View className={`h-12 flex-row items-center rounded-xl bg-gray-200 px-3 ${className}`}>
      <SearchIcon
        width={24}
        height={24}
        color={value ? '#2E3333' : '#929898'} /* gray-800 : gray-500 */
      />
      <RNTextInput
        ref={ref}
        value={value}
        placeholderTextColor="#929898" /* gray-500 */
        className="ml-1 flex-1 text-body-md text-gray-800"
        style={style}
        {...rest}
      />
      {onClear && value ? (
        <Pressable onPress={onClear} hitSlop={8} className="ml-1">
          <CloseIcon width={24} height={24} className="text-gray-800" />
        </Pressable>
      ) : null}
    </View>
  );
});
