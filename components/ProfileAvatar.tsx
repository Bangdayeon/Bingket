import { Image } from 'expo-image';
import ProfileLgSvg from '@/assets/default_profiles/profile_lg.svg';
import { FIXED } from '@/lib/use-colors';

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
  if (!avatarUrl) {
    return <ProfileLgSvg width={size} height={size} color={FIXED.avatarNeutral} />;
  }

  if (avatarUrl.startsWith('default:')) {
    const color = avatarUrl.slice('default:'.length);
    return <ProfileLgSvg width={size} height={size} color={color} />;
  }

  return (
    <Image
      source={{ uri: avatarUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );
}
