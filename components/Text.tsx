import { Text as RNText, TextProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

export function Text({ style, className, ...props }: TextProps) {
  return <RNText {...props} className={twMerge('font-pretendard', className)} style={style} />;
}
