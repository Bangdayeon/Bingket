import { useColorScheme, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import { CommunityPost } from '@/types/community';
import type { StoredBlock } from '@/types/community';
import { LikeButton } from './LikeButton';
import AnonymousProfile from '@/components/AnonymousProfile';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import BingoPreview from '@/components/BingoPreview';
import type { BingoData } from '@/types/bingo';

const ICON_SIZE = 24;

function postBingoToBingoData(bingo: NonNullable<CommunityPost['bingo']>): BingoData {
  return {
    id: bingo.id ?? 'preview',
    title: bingo.title ?? '',
    cells: bingo.cells,
    grid: bingo.grid,
    theme: bingo.theme,
    maxEdits: 0,
    achievedCount: 0,
    bingoCount: 0,
    dday: 0,
    startDate: null,
    targetDate: null,
    state: 'progress',
    retrospective: null,
  };
}

function parseBlocks(content: string): StoredBlock[] | null {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].type === 'string') {
      return parsed as StoredBlock[];
    }
  } catch {
    /* 구형 plain text */
  }
  return null;
}

interface PostCardProps {
  post: CommunityPost;
}

export function PostCard({ post }: PostCardProps) {
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' : '#4C5252';

  // blocks 기반 첫 번째 미디어 탐색
  const blocks = parseBlocks(post.body);
  let firstImageUrl: string | null = null;
  let hasBingo = false;

  if (blocks) {
    for (const b of blocks) {
      if (b.type === 'image' && !firstImageUrl) {
        firstImageUrl = (post.imageUrls ?? [])[b.index] ?? null;
      }
      if (b.type === 'bingo') hasBingo = true;
    }
  } else {
    // 구형: bingo > image 우선
    if (post.bingo) hasBingo = true;
    else if (post.imageUrls?.length) firstImageUrl = post.imageUrls[0];
  }

  const bingoData = hasBingo && post.bingo ? postBingoToBingoData(post.bingo) : null;

  return (
    <View className="px-5 pt-4 pb-4">
      {/* 작성자 */}
      <View className="flex-row items-center gap-2">
        {post.isAnonymous ? (
          <AnonymousProfile seed={post.id} size="md" />
        ) : (
          <ProfileAvatar avatarUrl={post.avatarUrl ?? null} size={32} />
        )}
        <View className="flex-row items-center gap-1">
          <Text className="text-label-sm">{post.author}</Text>
          <Text className="text-caption-sm" style={{ color: '#181C1C' }}>
            •
          </Text>
          <Text className="text-caption-sm" style={{ color: '#929898' }}>
            {post.timeAgo}
          </Text>
        </View>
      </View>

      {/* 제목 */}
      <Text className="text-label-md mt-4">{post.title}</Text>

      {/* 미디어 썸네일 (빙고 우선, 없으면 첫 이미지) */}
      {bingoData ? (
        <View className="mt-4">
          <BingoPreview bingo={bingoData} size="md" />
        </View>
      ) : firstImageUrl ? (
        <Image
          source={{ uri: firstImageUrl }}
          style={{ width: '100%', aspectRatio: 1, borderRadius: 8, marginTop: 12 }}
          contentFit="contain"
          cachePolicy="memory"
        />
      ) : null}

      {/* 좋아요 / 댓글 */}
      <View className="flex-row items-center gap-4 mt-3">
        <LikeButton
          count={post.likeCount}
          iconColor={iconColor}
          postId={post.id}
          initialLiked={post.likedByMe}
        />
        <View className="flex-row items-center gap-1">
          <SMSIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />
          <Text className="text-body-sm">{post.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}
