import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  userId: string | null | undefined;
  isAnonymous: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * 작성자 아바타·이름을 그 사람 프로필로 보내는 링크.
 *
 * 익명 글·댓글은 절대 감싸지 않는다. 익명 항목에도 userId 는 들어 있어서,
 * 링크를 걸면 탭 한 번에 익명이 풀린다. 잠금 판정(비공개/친구공개)은 프로필
 * 화면이 하므로 여기서는 익명 여부만 본다.
 */
export function AuthorLink({ userId, isAnonymous, className = '', children }: Props) {
  const router = useRouter();

  if (isAnonymous || !userId) {
    return <View className={className}>{children}</View>;
  }

  return (
    <Pressable
      className={className}
      hitSlop={4}
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: userId } })}
    >
      {children}
    </Pressable>
  );
}
