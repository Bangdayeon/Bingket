import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  userId: string | null | undefined;
  isAnonymous: boolean;
  className?: string;
  children: ReactNode;
}

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
