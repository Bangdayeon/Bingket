import { memo, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import MoreIcon from '@/assets/icons/ic_more_vert.svg';
import { CommunityPost } from '@/types/community';
import type { StoredBlock } from '@/types/community';
import { LikeButton } from './LikeButton';
import { AuthorLink } from './AuthorLink';
import AnonymousProfile from '@/components/AnonymousProfile';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import BingoPreview from '@/components/BingoPreview';
import type { BingoData } from '@/types/bingo';
import { Popover } from '@/components/Popover';
import { Modal } from '@/components/Modal';
import { submitReport, blockUser } from '@/features/community/lib/community';
import { useTranslation } from 'react-i18next';

const REPORT_REASONS = [
  {
    value: 'ad',
    labelKey: 'board.moderation.report.reason.ad',
  },
  {
    value: 'abuse',
    labelKey: 'board.moderation.report.reason.abuse',
  },
  {
    value: 'sexual',
    labelKey: 'board.moderation.report.reason.sexual',
  },
  {
    value: 'spam',
    labelKey: 'board.moderation.report.reason.spam',
  },
  {
    value: 'impersonation',
    labelKey: 'board.moderation.report.reason.impersonation',
  },
  {
    value: 'other',
    labelKey: 'board.moderation.report.reason.other',
  },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]['value'];

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
    /* old plain text */
  }
  return null;
}

function bodyPreview(blocks: StoredBlock[] | null, raw: string): string {
  const text = blocks
    ? blocks
        .filter((b): b is Extract<StoredBlock, { type: 'text' }> => b.type === 'text')
        .map((b) => b.value)
        .join(' ')
    : raw;
  return text.replace(/\s+/g, ' ').trim();
}

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string | null;
  onBlock?: (userId: string) => void;
}

export const PostCard = memo(function PostCard({ post, currentUserId, onBlock }: PostCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);

  const ownership =
    currentUserId == null ? 'unknown' : post.userId === currentUserId ? 'mine' : 'others';

  const { firstImageUrl, bingoData } = useMemo(() => {
    const blocks = parseBlocks(post.body);

    let firstImageUrl: string | null = null;
    let hasBingo = false;

    if (blocks) {
      for (const block of blocks) {
        if (block.type === 'image' && firstImageUrl === null) {
          firstImageUrl = (post.imageUrls ?? [])[block.index] ?? null;
        }

        if (block.type === 'bingo') {
          hasBingo = true;
        }
      }
    } else {
      if (post.bingo) {
        hasBingo = true;
      } else if (post.imageUrls?.length) {
        firstImageUrl = post.imageUrls[0];
      }
    }

    const bingoData = hasBingo && post.bingo ? postBingoToBingoData(post.bingo) : null;

    const preview = bodyPreview(blocks, post.body);

    return {
      blocks,
      firstImageUrl,
      hasBingo,
      bingoData,
      preview,
    };
  }, [post.body, post.imageUrls, post.bingo]);

  const menuItems =
    ownership === 'mine'
      ? [
          {
            label: t('board.post.edit.menu'),
            onPress: () => router.push(`/community/write?postId=${post.id}`),
          },
        ]
      : [
          {
            label: t('board.moderation.report.menu'),
            onPress: () => setShowReportModal(true),
          },
          ...(post.user?.is_deleted
            ? []
            : [
                {
                  label: t('board.moderation.block.menu'),
                  danger: true as const,
                  onPress: () => setShowBlockModal(true),
                },
              ]),
        ];

  return (
    <View className="px-4 pb-4 pt-4">
      {/* AUTHOR */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <AuthorLink userId={post.userId} isAnonymous={post.isAnonymous}>
            {post.isAnonymous ? (
              <AnonymousProfile seed={post.id} />
            ) : (
              <ProfileAvatar avatarUrl={post.avatarUrl ?? null} size={40} />
            )}
          </AuthorLink>
          <View className="shrink flex-row items-center gap-0.5">
            <AuthorLink userId={post.userId} isAnonymous={post.isAnonymous} className="shrink">
              <Text className="shrink text-body-md text-gray-800" numberOfLines={1}>
                {post.author}{' '}
              </Text>
            </AuthorLink>
            <Text className="text-caption-sm text-gray-600">· {post.timeAgo}</Text>
          </View>
        </View>
        {ownership !== 'unknown' && (
          <Pressable onPress={() => setShowMenu((v) => !v)} hitSlop={8}>
            <MoreIcon width={24} height={24} className="text-gray-500" />
          </Pressable>
        )}
      </View>

      <Popover
        visible={showMenu}
        items={menuItems}
        onDismiss={() => setShowMenu(false)}
        style={{ top: 52, right: 10 }}
      />

      {/* media thumbnail */}
      {bingoData ? (
        <View className="mt-4 overflow-hidden rounded-2xl">
          <BingoPreview bingo={bingoData} size="md" square />
        </View>
      ) : firstImageUrl ? (
        <Image
          source={{ uri: firstImageUrl }}
          style={{ width: '100%', aspectRatio: 1, borderRadius: 16, marginTop: 16 }}
          contentFit="contain"
          cachePolicy="memory"
          recyclingKey={post.id}
        />
      ) : null}

      <Text className="mt-3 text-label-md text-gray-800" numberOfLines={2}>
        {post.title}
      </Text>

      {/* === LIKE / COMMENT === */}
      <View className="flex-row items-center gap-4 mt-3">
        <LikeButton count={post.likeCount} postId={post.id} initialLiked={post.likedByMe} />
        <View className="flex-row items-center gap-1">
          <SMSIcon width={24} height={24} className="text-gray-400" />
          <Text className="text-body-sm text-gray-700">{post.commentCount}</Text>
        </View>
      </View>

      {/* REPORT */}
      <Modal
        visible={showReportModal}
        confirmLoading={isReporting}
        title={t('board.moderation.report.menu')}
        body={
          <View className="gap-3">
            <Text className="text-body-sm text-gray-700">
              {t('board.moderation.report.explanation')}
            </Text>
            <View>
              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason.value}
                  onPress={() => setSelectedReason(reason.value)}
                  className="flex-row items-center gap-3 py-1.5"
                >
                  <View
                    className={`h-4 w-4 items-center justify-center rounded-full ${
                      selectedReason === reason.value ? 'border-green-400' : 'border-gray-300'
                    }`}
                    style={{ borderWidth: 1.5 }}
                  >
                    {selectedReason === reason.value && (
                      <View className="h-2 w-2 rounded-full bg-green-400" />
                    )}
                  </View>

                  <Text className="text-body-md">{t(reason.labelKey)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        variant="warning"
        confirmLabel={t('board.moderation.report.confirm')}
        cancelLabel={t('common.cancel')}
        confirmDisabled={!selectedReason}
        onConfirm={async () => {
          if (!selectedReason) return;
          setIsReporting(true);
          try {
            await submitReport('post', post.id, selectedReason);
            setShowReportModal(false);
            setSelectedReason(null);
            setAlertModal({
              title: t('board.moderation.report.success.title'),
              message: t('board.moderation.report.success.body'),
            });
          } catch (e) {
            setAlertModal({
              title: t('board.moderation.report.error'),
              message: e instanceof Error ? e.message : t('common.error.retry'),
            });
          } finally {
            setIsReporting(false);
          }
        }}
        onCancel={() => {
          if (isReporting) return;
          setShowReportModal(false);
          setSelectedReason(null);
        }}
        onDismiss={() => {
          if (isReporting) return;
          setShowReportModal(false);
        }}
      />

      {/* BLOCK */}
      <Modal
        visible={showBlockModal}
        confirmLoading={isBlocking}
        title={t('board.moderation.block.menu')}
        body={
          <Text className="text-body-sm text-gray-500">{t('board.moderation.block.body')}</Text>
        }
        variant="error"
        confirmLabel={t('board.moderation.block.confirm')}
        onConfirm={async () => {
          setIsBlocking(true);
          try {
            await blockUser(post.userId);
            setShowBlockModal(false);
            onBlock?.(post.userId);
          } catch (e) {
            setShowBlockModal(false);
            setAlertModal({
              title: t('board.moderation.block.error'),
              message: e instanceof Error ? e.message : t('common.error.retry'),
            });
          } finally {
            setIsBlocking(false);
          }
        }}
        onDismiss={() => !isBlocking && setShowBlockModal(false)}
      />

      <Modal
        visible={alertModal !== null}
        title={alertModal?.title ?? ''}
        body={alertModal?.message ?? ''}
        variant="single"
        onConfirm={() => setAlertModal(null)}
        onDismiss={() => setAlertModal(null)}
      />
    </View>
  );
});
