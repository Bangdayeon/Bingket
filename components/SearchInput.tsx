import { forwardRef } from 'react';
import { Pressable, TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import CloseIcon from '@/assets/icons/ic_close.svg';
import SearchIcon from '@/assets/icons/ic_search.svg';

interface SearchInputProps extends Omit<TextInputProps, 'placeholderTextColor'> {
  onClear?: () => void;
  className?: string;
}

export const SearchInput = forwardRef<RNTextInput, SearchInputProps>(function SearchInput(
  { onClear, className = '', value, style, ...rest },
  ref,
) {
  return (
    <View className={`h-12 flex-row items-center rounded-xl bg-gray-200 px-3 ${className}`}>
      <SearchIcon width={24} height={24} className={value ? 'text-gray-800' : 'text-gray-500'} />
      <RNTextInput
        ref={ref}
        value={value}
        className="ml-1 flex-1 text-body-md text-gray-800 placeholder:text-gray-500"
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
