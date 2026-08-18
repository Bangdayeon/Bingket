import { View } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { WinnerCrown } from '@/features/team/components/WinnerCrown';

export interface TeamAvatarMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isWinner?: boolean;
}

interface TeamAvatarsProps {
  members: TeamAvatarMember[];
  size?: number;
}

const DEFAULT_SIZE = 32;
const OVERLAP_RATIO = 0.375;

/**
 * 팀원 아바타를 겹쳐서 보여준다.
 *
 * 배열 순서를 그대로 쓴다 -- 호출하는 쪽이 이미 1등부터 정렬해서 넘긴다.
 * 왕관이 뒤 아바타에 가리지 않도록 앞사람일수록 위에 쌓는다.
 */
export function TeamAvatars({ members, size = DEFAULT_SIZE }: TeamAvatarsProps) {
  if (members.length === 0) return null;

  const overlap = Math.round(size * OVERLAP_RATIO);
  const step = size - overlap;
  const width = size + step * (members.length - 1);

  return (
    <View style={{ width, height: size }}>
      {members.map((member, index) => (
        <View
          key={member.userId}
          style={{
            position: 'absolute',
            bottom: 0,
            left: step * index,
            width: size,
            alignItems: 'center',
            zIndex: members.length - index,
          }}
        >
          <WinnerCrown visible={member.isWinner === true} />
          <ProfileAvatar size={size} avatarUrl={member.avatarUrl} />
        </View>
      ))}
    </View>
  );
}
