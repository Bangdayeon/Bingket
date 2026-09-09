import ProfileMd from '@/assets/default_profiles/profile_md.svg';

const ANONYMOUS_COLORS = [
  '#F79A6E', // peach-400
  '#54DBED', // sky-400
  '#6ADE50', // green-500
  '#EC5858', // red-400
  '#C0B0F5', // lavender-300
  '#F5E060', // yellow-300
] as const;

function getColor(seed: string): string {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ANONYMOUS_COLORS[hash % ANONYMOUS_COLORS.length];
}

interface AnonymousProfileProps {
  seed: string | null;
}

/** 익명 게시글·댓글의 기본 프로필. 크기는 32 하나뿐이다(시안 댓글 아바타와 같다). */
export default function AnonymousProfile({ seed }: AnonymousProfileProps) {
  const color = seed === null ? '#9CA3AF' /* gray-400 */ : getColor(seed);

  return <ProfileMd color={color} />;
}
