import { useState } from 'react';
import { Image as RNImage, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import AlertIcon from '@/assets/icons/alert.png';
import { CommunityPost } from '@/types/community';
import type { StoredBlock } from '@/types/community';
import { LikeButton } from './LikeButton';
import AnonymousProfile from '@/components/AnonymousProfile';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import BingoPreview from '@/components/BingoPreview';
import type { BingoData } from '@/types/bingo';
import { Popover } from '@/components/Popover';
import { Modal } from '@/components/Modal';
import { submitReport, blockUser } from '@/features/community/lib/community';

const ICON_SIZE = 24;

const REPORT_REASONS = [
  '상업적 광고 및 판매',
  '욕설/비하',
  '음란물/성적인 내용',
  '도배',
  '사칭/사기',
  '기타',
];

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
  currentUserId?: string | null;
  onBlock?: (userId: string) => void;
}

export function PostCard({ post, currentUserId, onBlock }: PostCardProps) {
  const iconColor = '#4C5252'; /* gray-700 */

  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);

  const isOwnPost = currentUserId != null ? post.userId === currentUserId : true;

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
    if (post.bingo) hasBingo = true;
    else if (post.imageUrls?.length) firstImageUrl = post.imageUrls[0];
  }

  const bingoData = hasBingo && post.bingo ? postBingoToBingoData(post.bingo) : null;

  const menuItems = [
    {
      label: '신고하기',
      onPress: () => setShowReportModal(true),
    },
    ...(post.user?.is_deleted
      ? []
      : [
          {
            label: '차단하기',
            danger: true as const,
            onPress: () => setShowBlockModal(true),
          },
        ]),
  ];

  return (
    <View className="px-5 pt-4 pb-4">
      {/* 작성자 */}
      <View className="flex-row items-center justify-between">
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
            <Text className="text-caption-sm" style={{ color: '#929898' /* gray-500 */ }}>
              {post.timeAgo}
            </Text>
          </View>
        </View>
        {!isOwnPost && (
          <Pressable onPress={() => setShowMenu((v) => !v)} hitSlop={8}>
            <RNImage source={AlertIcon} style={{ width: 24, height: 24 }} />
          </Pressable>
        )}
      </View>

      <Popover
        visible={showMenu}
        items={menuItems}
        onDismiss={() => setShowMenu(false)}
        style={{ top: 52, right: 10 }}
      />

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

      {/* 신고하기 모달 */}
      <Modal
        visible={showReportModal}
        confirmLoading={isReporting}
        title="신고하기"
        body={
          <View className="gap-3">
            <Text className="text-body-sm text-gray-700">
              누적 신고 횟수가 3회 이상인 유저는 커뮤니티 이용 제한이 있을 수 있습니다.
            </Text>
            {REPORT_REASONS.map((reason) => (
              <Pressable
                key={reason}
                onPress={() => setSelectedReason(reason)}
                className="flex-row items-center gap-3 py-2"
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: selectedReason === reason ? '#28C8DE' : '#D2D6D6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedReason === reason && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#28C8DE',
                      }}
                    />
                  )}
                </View>
                <Text className="text-body-md">{reason}</Text>
              </Pressable>
            ))}
          </View>
        }
        variant="default"
        confirmLabel="신고하기"
        cancelLabel="취소하기"
        confirmDisabled={!selectedReason}
        onConfirm={async () => {
          if (!selectedReason) return;
          setIsReporting(true);
          try {
            await submitReport('post', post.id, selectedReason);
            setShowReportModal(false);
            setSelectedReason(null);
            setAlertModal({
              title: '신고 완료',
              message: '신고가 접수되었습니다. 24시간 내에 처리됩니다.',
            });
          } catch (e) {
            setAlertModal({
              title: '오류',
              message: e instanceof Error ? e.message : '신고에 실패했습니다.',
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

      {/* 차단하기 모달 */}
      <Modal
        visible={showBlockModal}
        confirmLoading={isBlocking}
        title="차단하기"
        body={
          <Text className="text-body-sm text-gray-500">
            이 사용자를 차단하시겠어요?{'\n'}
            차단된 사용자의 게시글과 댓글이 보이지 않습니다.
          </Text>
        }
        variant="single"
        confirmLabel="차단하기"
        onConfirm={async () => {
          setIsBlocking(true);
          try {
            await blockUser(post.userId);
            setShowBlockModal(false);
            onBlock?.(post.userId);
          } catch (e) {
            setShowBlockModal(false);
            setAlertModal({
              title: '오류',
              message: e instanceof Error ? e.message : '차단에 실패했습니다.',
            });
          } finally {
            setIsBlocking(false);
          }
        }}
        onDismiss={() => !isBlocking && setShowBlockModal(false)}
      />

      {/* 범용 알림 모달 */}
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
}
