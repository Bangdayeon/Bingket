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
