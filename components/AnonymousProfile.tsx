import ProfileMd from '@/assets/default_profiles/profile_md.svg';
import { FIXED } from '@/lib/use-colors';

// 색상 시스템 밖의 고정 팔레트. 사용자 정체성을 구분하는 색이라 테마를 따르지 않는다.
const ANONYMOUS_COLORS = FIXED.avatar;

function getColor(seed: string): string {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ANONYMOUS_COLORS[hash % ANONYMOUS_COLORS.length];
}

interface AnonymousProfileProps {
  seed: string | null;
}

/** 익명 게시글·댓글의 기본 프로필. 크기는 32 하나뿐이다(시안 댓글 아바타와 같다). */
export default function AnonymousProfile({ seed }: AnonymousProfileProps) {
  const color = seed === null ? FIXED.avatarNeutral : getColor(seed);

  return <ProfileMd color={color} />;
}
