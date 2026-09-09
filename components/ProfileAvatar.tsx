import { Image } from 'expo-image';
import ProfileLgSvg from '@/assets/default_profiles/profile_lg.svg';

export const DEFAULT_AVATAR_COLORS = [
  '#F79A6E', // peach400
  '#6ADE50', // green500
  '#C0B0F5', // lavender300
  '#EC5858', // red400
  '#F5E060', // yellow300
  '#54DBED', // sky400
] as const;

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
    const grayColor = '#D2D6D6';
    return <ProfileLgSvg width={size} height={size} color={grayColor} />;
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
