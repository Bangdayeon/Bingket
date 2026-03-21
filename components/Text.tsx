import { Text as RNText, TextProps } from 'react-native';

export function Text({ style, className, ...props }: TextProps) {
  return (
    <RNText
      {...props}
      className={`text-gray-900 dark:text-gray-100${className ? ` ${className}` : ''}`}
      style={style}
    />
  );
}
