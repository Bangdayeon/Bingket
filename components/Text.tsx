import { Text as RNText, TextProps } from 'react-native';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  override: {
    classGroups: {
      'font-size': [
        {
          text: [
            'title-lg',
            'title-md',
            'title-sm',
            'body-md',
            'body-sm',
            'caption-md',
            'caption-sm',
            'label-sm',
            'label-md',
          ],
        },
      ],
      'font-family': [
        {
          font: ['pretendard', 'pretendard-medium', 'pretendard-semibold', 'pretendard-bold'],
        },
      ],
    },
  },
});

export function Text({ style, className, ...props }: TextProps) {
  return (
    <RNText
      {...props}
      className={twMerge('font-pretendard text-gray-800', className)}
      style={style}
    />
  );
}
