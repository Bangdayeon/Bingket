import { Image } from 'expo-image';
import ProfileLgSvg from '@/assets/default_profiles/profile_lg.svg';
import { FIXED } from '@/lib/use-colors';

// users.avatar_url에 'default:#F79A6E' 형태로 저장되는 값이라 절대 바꾸면 안 된다.
export const DEFAULT_AVATAR_COLORS = FIXED.avatar;

export const DEFAULT_AVATAR_PREFIX = 'default:';

export function randomDefaultAvatarUrl(): string {
  const color = DEFAULT_AVATAR_COLORS[Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length)];
  return `${DEFAULT_AVATAR_PREFIX}${color}`;
}

interface ProfileAvatarProps {
  avatarUrl: string | null | undefined;
  size?: number; // px
}

export function ProfileAvatar({ avatarUrl, size = 40 }: ProfileAvatarProps) {
  // 유저 프로필이 없는 경우 → 회색 고정
  if (!avatarUrl) {
    return <ProfileLgSvg width={size} height={size} color={FIXED.avatarNeutral} />;
  }

  // 기본 컬러 지정된 경우
  if (avatarUrl.startsWith('default:')) {
    const color = avatarUrl.slice('default:'.length);
    return <ProfileLgSvg width={size} height={size} color={color} />;
  }

  // 외부 URL
  return (
    <Image
      source={{ uri: avatarUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );
}
