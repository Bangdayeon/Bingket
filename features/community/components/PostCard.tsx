import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import MoreIcon from '@/assets/icons/ic_more_vert.svg';
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

/** 목록에 보여줄 본문 미리보기. 개행은 공백으로 눌러 두 줄 안에 최대한 담는다 */
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

export function PostCard({ post, currentUserId, onBlock }: PostCardProps) {
  const router = useRouter();

  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);

  /**
   * 검색 화면처럼 로그인 사용자를 안 넘기는 곳이 있다. 그때는 내 글인지 알 수 없으므로
   * 메뉴를 아예 열지 않는다 — 남의 글에 '수정하기'를 띄우거나 내 글을 신고하게 두면 안 된다.
   */
  const ownership =
    currentUserId == null ? 'unknown' : post.userId === currentUserId ? 'mine' : 'others';

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
  const preview = bodyPreview(blocks, post.body);

  const menuItems =
    ownership === 'mine'
      ? [{ label: '수정하기', onPress: () => router.push(`/community/write?postId=${post.id}`) }]
      : [
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
    <View className="px-4 pb-4 pt-4">
      {/* 작성자 */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {post.isAnonymous ? (
            <AnonymousProfile seed={post.id} />
          ) : (
            <ProfileAvatar avatarUrl={post.avatarUrl ?? null} size={40} />
          )}
          <View className="shrink flex-row items-center gap-0.5">
            <Text className="shrink text-body-md text-gray-800" numberOfLines={1}>
              {post.author}{' '}
            </Text>
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

      {/* 미디어 썸네일 (빙고 우선, 없으면 첫 이미지).
          빙고는 목록에서 정사각형으로 자른다 — 3:4 그대로 두면 카드 하나가 화면을 거의 다
          먹어 다음 글이 안 보인다. 전체 판은 게시글 상세에서 보여준다. */}
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
        />
      ) : null}

      {/* 본문 미리보기 */}
      {preview ? (
        <Text className="mt-3 text-body-sm text-gray-800" numberOfLines={2}>
          {preview}
        </Text>
      ) : null}

      {/* 좋아요 / 댓글 */}
      <View className="flex-row items-center gap-4 mt-3">
        <LikeButton count={post.likeCount} postId={post.id} initialLiked={post.likedByMe} />
        <View className="flex-row items-center gap-1">
          <SMSIcon width={24} height={24} className="text-gray-400" />
          <Text className="text-body-sm text-gray-700">{post.commentCount}</Text>
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
            {/* 선택지끼리는 바깥 gap-3을 받지 않는다. 줄마다 py-1.5만 줘서 간격 12,
                터치 영역은 32를 유지한다. */}
            <View>
              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  className="flex-row items-center gap-3 py-1.5"
                >
                  <View
                    className={`h-4 w-4 items-center justify-center rounded-full ${
                      selectedReason === reason ? 'border-green-400' : 'border-gray-300'
                    }`}
                    style={{ borderWidth: 1.5 }}
                  >
                    {selectedReason === reason && (
                      <View className="h-2 w-2 rounded-full bg-green-400" />
                    )}
                  </View>
                  <Text className="text-body-md">{reason}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        variant="warning" // danger 확인 + 취소 버튼 둘 다 사용
        confirmLabel="신고"
        cancelLabel="취소"
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
        variant="error" // danger 단일 버튼
        confirmLabel="차단"
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
