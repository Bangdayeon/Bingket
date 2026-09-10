import { Text as RNText, TextProps } from 'react-native';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge는 `text-body-md` 같은 커스텀 fontSize를 임의 색상으로 오인해
 * 기본 색(`text-gray-900`)과 충돌 처리하고 지워 버린다. 두 그룹을 명시해 준다.
 */
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

/**
 * 색을 지정하지 않은 Text는 RN 플랫폼 기본색(검정)으로 그려져 다크모드에서 사라진다.
 * 앱 전체에서 색 클래스 없이 쓰이는 Text가 90곳 넘게 있어 여기서 기본색을 준다.
 */
export function Text({ style, className, ...props }: TextProps) {
  return (
    <RNText
      {...props}
      className={twMerge('font-pretendard text-gray-900', className)}
      style={style}
    />
  );
}
