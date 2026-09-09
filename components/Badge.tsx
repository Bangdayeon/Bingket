import { Pressable, View } from 'react-native';
import CloseIcon from '@/assets/icons/ic_close.svg';
import { Text } from './Text';

type Tone = 'default' | 'colored';
type Size = 'sm' | 'md';

interface BadgeProps {
  label: string;
  /** 라벨을 누를 수 있게 한다. 최근 검색어처럼 눌러서 재검색하는 곳에 쓴다. */
  onPress?: () => void;
  tone?: Tone;
  size?: Size;
  /** 넘기면 시안의 canDel 변형 — 테두리와 삭제 버튼이 붙는다. */
  onDelete?: () => void;
  className?: string;
}

// 시안 bage: md는 높이 40 / 좌우 12 / 위아래 4, sm은 높이 20 / 좌우 6 / 위아래 2.
const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'h-5 px-1.5 py-0.5', text: 'text-caption-sm' },
  md: { container: 'h-10 px-3 py-1', text: '' },
};

const toneStyles: Record<Tone, { container: string; text: string }> = {
  default: { container: 'bg-white', text: 'text-gray-800' },
  colored: { container: 'bg-green-200 border border-green-200', text: 'text-green-800' },
};

export function Badge({
  label,
  tone = 'default',
  size = 'md',
  onPress,
  onDelete,
  className = '',
}: BadgeProps) {
  const { container: sizeContainer, text: sizeText } = sizeStyles[size];
  const { container, text } = toneStyles[tone];

  // md는 기본이 body-sm(Regular), colored만 label-sm(SemiBold)로 강조된다.
  const typography =
    size === 'sm'
      ? sizeText
      : tone === 'colored'
        ? 'text-label-sm font-pretendard-semibold'
        : 'text-body-sm';

  return (
    <View
      className={`flex-row items-center justify-center rounded-[99px] ${sizeContainer} ${container} ${
        onDelete ? 'gap-2.5 border border-gray-200' : ''
      } ${className}`}
    >
      {onPress ? (
        <Pressable onPress={onPress} hitSlop={4}>
          <Text className={`${typography} ${text}`}>{label}</Text>
        </Pressable>
      ) : (
        <Text className={`${typography} ${text}`}>{label}</Text>
      )}
      {onDelete && (
        <Pressable onPress={onDelete} hitSlop={8}>
          <CloseIcon width={18} height={18} color="#6E7575" /* gray-600 */ />
        </Pressable>
      )}
    </View>
  );
}
