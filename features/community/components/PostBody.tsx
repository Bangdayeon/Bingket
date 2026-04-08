import { Image, View } from 'react-native';
import { Text } from '@/components/Text';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import { LikeButton } from './LikeButton';
import AnonymousProfile from '@/components/AnonymousProfile';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { CommunityPost } from '@/types/community';
import type { StoredBlock } from '@/types/community';
import BingoPreview from '@/components/BingoPreview';
import type { BingoData } from '@/types/bingo';

const ICON_SIZE = 20;

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
    /* noop */
  }
  return null;
}

interface PostBodyProps {
  post: CommunityPost;
  iconColor: string;
}

export function PostBody({ post, iconColor }: PostBodyProps) {
  const blocks = parseBlocks(post.body);
  const bingoData = post.bingo ? postBingoToBingoData(post.bingo) : null;

  const textBlocks =
    blocks?.filter((b): b is StoredBlock & { type: 'text' } => b.type === 'text') ?? [];
  const mediaBlocks = blocks?.filter((b) => b.type !== 'text') ?? [];

  return (
    <View className="px-5 pt-4">
      {/* 작성자 */}
      <View className="flex-row items-center gap-2">
        {post.isAnonymous ? (
          <AnonymousProfile seed={post.id} size="md" />
        ) : (
          <ProfileAvatar avatarUrl={post.avatarUrl ?? null} size={32} />
        )}
        <Text className="text-label-sm">{post.author}</Text>
        <Text className="text-caption-sm" style={{ color: '#181C1C' }}>
          •
        </Text>
        <Text className="text-caption-sm" style={{ color: '#929898' }}>
          {post.timeAgo}
        </Text>
      </View>

      <Text className="text-title-md mt-3">{post.title}</Text>

      {blocks ? (
        <>
          {/* 본문 텍스트 (항상 최상단) */}
          {textBlocks.map((block, i) =>
            block.value ? (
              <Text key={i} className="text-body-sm mt-3">
                {block.value}
              </Text>
            ) : null,
          )}

          {/* 미디어 (빙고, 이미지) */}
          {mediaBlocks.map((block, i) => {
            if (block.type === 'image') {
              const url = (post.imageUrls ?? [])[block.index];
              return url ? (
                <Image
                  key={i}
                  source={{ uri: url }}
                  style={{ width: '100%', height: 220, borderRadius: 12, marginTop: 12 }}
                  resizeMode="cover"
                />
              ) : null;
            }
            if (block.type === 'bingo' && bingoData) {
              return (
                <View key={i} className="mt-3">
                  <BingoPreview bingo={bingoData} size="md" />
                </View>
              );
            }
            return null;
          })}
        </>
      ) : (
        <>
          <Text className="text-body-sm mt-3">{post.body}</Text>
          {bingoData && (
            <View className="mt-3">
              <BingoPreview bingo={bingoData} size="md" />
            </View>
          )}
          {post.imageUrls?.map((url, i) => (
            <Image
              key={i}
              source={{ uri: url }}
              style={{ width: '100%', height: 220, borderRadius: 12, marginTop: 12 }}
              resizeMode="cover"
            />
          ))}
        </>
      )}

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
