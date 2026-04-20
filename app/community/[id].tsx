import { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import { Popover } from '@/components/Popover';
import { PostHeader, HEADER_H } from '@/features/community/components/PostHeader';
import { PostBody } from '@/features/community/components/PostBody';
import { CommentSection } from '@/features/community/components/CommentSection';
import { CommentInput } from '@/features/community/components/CommentInput';
import { Comment, CommunityPost } from '@/types/community';
import {
  fetchPost,
  deletePost,
  fetchComments,
  addComment,
  deleteComment,
  submitReport,
  blockUser,
} from '@/features/community/lib/community';
import { checkAndAwardBadges } from '@/lib/badge-checker';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { containsBadWord } from '@/constants/bad-words';
import Loading from '@/components/Loading';

const REPORT_REASONS = [
  '상업적 광고 및 판매',
  '욕설/비하',
  '음란물/성적인 내용',
  '도배',
  '사칭/사기',
  '기타',
];

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const iconColor = '#4C5252'; /* gray-700 */

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [, setCommentsLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [keyboardShown, setKeyboardShown] = useState(false);

  // ── 모달 상태 ──────────────────────────────────────────────
  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);

  const [showPostMenu, setShowPostMenu] = useState(false);
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const [commentMenuTop, setCommentMenuTop] = useState(0);
  const [commentMenuTargetUserId, setCommentMenuTargetUserId] = useState<string | undefined>(
    undefined,
  );

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: string } | null>(
    null,
  );
  const [isReporting, setIsReporting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [deleteCommentTargetId, setDeleteCommentTargetId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockTargetUserId, setBlockTargetUserId] = useState<string | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      fetchPost(id).then((data) => {
        setPost(data);
        setPostLoading(false);
      });
    }, [id]),
  );

  useEffect(() => {
    if (!id) return;
    setCommentsLoading(true);
    fetchComments(id).then((data) => {
      setLocalComments(data);
      setCommentsLoading(false);
    });
  }, [id]);

  const refreshComments = useCallback(async () => {
    if (!id) return;
    const data = await fetchComments(id);
    setLocalComments(data);
    const count = data.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);
    setPost((p) => (p ? { ...p, commentCount: count } : p));
  }, [id]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardShown(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (postLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white  " edges={['top']}>
        <View className="flex-row items-center border-b border-gray-300  " style={{ height: 60 }}>
          <View style={{ width: 56 }} className="pl-4">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <ArrowBackIcon width={20} height={20} color={iconColor} />
            </Pressable>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <Loading color="#6ADE50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-white  " edges={['top']}>
        <View className="flex-row items-center border-b border-gray-300  " style={{ height: 60 }}>
          <View style={{ width: 56 }} className="pl-4">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <ArrowBackIcon width={20} height={20} color={iconColor} />
            </Pressable>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-body-lg" style={{ color: '#929898' /* gray-500 */ }}>
            게시글을 찾을 수 없습니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnPost = post.userId === currentUserId;

  // ── 핸들러 ─────────────────────────────────────────────────

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      setShowDeleteModal(false);
      router.back();
    } catch (e) {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setAlertModal({
        title: '삭제 실패',
        message: e instanceof Error ? e.message : '게시글 삭제에 실패했습니다.',
      });
    }
  };

  const handleAddComment = async () => {
    const trimmed = comment.trim();
    if (!trimmed || commentSubmitting) return;
    if (containsBadWord(trimmed)) {
      setToastVisible(true);
      return;
    }
    setCommentSubmitting(true);
    try {
      await addComment(post.id, trimmed, commentAnonymous, replyTo?.id);
      checkAndAwardBadges('comment');
      setComment('');
      setReplyTo(null);
      Keyboard.dismiss();
      await refreshComments();
    } catch (e) {
      setAlertModal({
        title: '오류',
        message: e instanceof Error ? e.message : '댓글 작성에 실패했습니다.',
      });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentMenuId(null);
    setDeleteCommentTargetId(commentId);
    setShowDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentTargetId) return;
    setIsDeletingComment(true);
    try {
      await deleteComment(deleteCommentTargetId);
      setShowDeleteCommentModal(false);
      setDeleteCommentTargetId(null);
      await refreshComments();
    } catch (e) {
      setShowDeleteCommentModal(false);
      setDeleteCommentTargetId(null);
      setAlertModal({
        title: '오류',
        message: e instanceof Error ? e.message : '댓글 삭제에 실패했습니다.',
      });
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleBlockUser = (userId: string) => {
    setBlockTargetUserId(userId);
    setShowBlockModal(true);
  };

  const confirmBlockUser = async () => {
    if (!blockTargetUserId) return;
    setIsBlocking(true);
    try {
      await blockUser(blockTargetUserId);
      setShowBlockModal(false);
      setBlockTargetUserId(null);
      setAlertModal({ title: '차단 완료', message: '해당 사용자를 차단했습니다.' });
    } catch (e) {
      setShowBlockModal(false);
      setBlockTargetUserId(null);
      setAlertModal({
        title: '오류',
        message: e instanceof Error ? e.message : '차단에 실패했습니다.',
      });
    } finally {
      setIsBlocking(false);
    }
  };

  // ── 팝오버 메뉴 아이템 ─────────────────────────────────────
  const postMenuItems = isOwnPost
    ? [
        {
          label: '수정하기',
          onPress: () => {
            setShowPostMenu(false);
            router.push({
              pathname: '/community/write',
              params: {
                postId: post.id,
                initTitle: post.title,
                initContent: post.body,
                initCategory: post.category,
                initImageUrls: JSON.stringify(post.imageUrls ?? []),
                initBingo: post.bingo ? JSON.stringify(post.bingo) : undefined,
                initIsAnonymous: post.isAnonymous ? '1' : '0',
              },
            });
          },
        },
        {
          label: '삭제하기',
          danger: true as const,
          onPress: () => {
            setShowPostMenu(false);
            setShowDeleteModal(true);
          },
        },
      ]
    : [
        {
          label: '신고하기',
          onPress: () => {
            setShowPostMenu(false);
            setReportTarget({ type: 'post', id: post.id });
            setShowReportModal(true);
          },
        },
        ...(post.user?.is_deleted
          ? []
          : [
              {
                label: '차단하기',
                danger: true as const,
                onPress: () => {
                  setShowPostMenu(false);
                  handleBlockUser(post.userId);
                },
              },
            ]),
      ];

  const isOwnComment = commentMenuTargetUserId === currentUserId;

  const commentMenuItems = isOwnComment
    ? [
        {
          label: '삭제하기',
          danger: true as const,
          onPress: () => commentMenuId && handleDeleteComment(commentMenuId),
        },
      ]
    : [
        {
          label: '신고하기',
          onPress: () => {
            if (commentMenuId) setReportTarget({ type: 'comment', id: commentMenuId });
            setCommentMenuId(null);
            setShowReportModal(true);
          },
        },
        {
          label: '차단하기',
          danger: true as const,
          onPress: () => {
            const uid = commentMenuTargetUserId;
            setCommentMenuId(null);
            if (uid) handleBlockUser(uid);
          },
        },
      ];

  const handleCommentMenuPress = (commentId: string, pageY: number) => {
    const userId =
      localComments.find((c) => c.id === commentId)?.userId ??
      localComments.flatMap((c) => c.replies ?? []).find((r) => r.id === commentId)?.userId;
    setCommentMenuTop(pageY - insets.top + 8);
    setCommentMenuId(commentId);
    setCommentMenuTargetUserId(userId);
  };

  return (
    <SafeAreaView className="flex-1 bg-white  " edges={['top']}>
      <PostHeader
        type={post.category}
        iconColor={iconColor}
        onBack={() => router.back()}
        onMenuPress={() => setShowPostMenu((v) => !v)}
      />

      <Popover
        visible={showPostMenu}
        items={postMenuItems}
        onDismiss={() => setShowPostMenu(false)}
        style={{ top: HEADER_H + 8, right: 16 }}
      />
      <Popover
        visible={commentMenuId !== null}
        items={commentMenuItems}
        onDismiss={() => setCommentMenuId(null)}
        style={{ top: commentMenuTop, right: 16 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <PostBody post={post} iconColor={iconColor} />
          <CommentSection
            comments={localComments}
            postAuthorId={post.userId}
            iconColor={iconColor}
            onMenuPress={handleCommentMenuPress}
            onReplyPress={(replyId, author) => setReplyTo({ id: replyId, author })}
          />
        </ScrollView>

        <CommentInput
          value={comment}
          onChangeText={setComment}
          onSubmit={handleAddComment}
          paddingBottom={keyboardShown ? 8 : insets.bottom + 8}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          isAnonymous={commentAnonymous}
          onToggleAnonymous={() => setCommentAnonymous((v) => !v)}
          isSubmitting={commentSubmitting}
        />
      </KeyboardAvoidingView>

      {/* ── 신고하기 모달 ── */}
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
        variant="default" // 확인 + 취소 버튼 둘 다 사용
        confirmLabel="신고하기"
        cancelLabel="취소하기"
        onConfirm={async () => {
          if (!selectedReason || !reportTarget) return;
          setIsReporting(true);
          try {
            await submitReport(reportTarget.type, reportTarget.id, selectedReason);
            setShowReportModal(false);
            setSelectedReason(null);
            setReportTarget(null);
            setAlertModal({ title: '신고 완료', message: '신고 내용은 24시간 이내에 조치됩니다.' });
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
          setReportTarget(null);
        }}
        onDismiss={() => {
          if (isReporting) return;
          setShowReportModal(false);
        }}
      />

      {/* ── 게시글 삭제 확인 모달 ── */}
      <Modal
        visible={showDeleteModal}
        title="게시글 삭제"
        confirmLoading={isDeleting}
        body={
          <>
            <Text className="text-body-sm text-gray-500">
              정말로 삭제하시겠어요?{'\n'}
              삭제된 게시글은 복구할 수 없어요.
            </Text>
          </>
        }
        variant="single"
        confirmLabel="삭제하기"
        onConfirm={handleDeletePost}
        onDismiss={() => !isDeleting && setShowDeleteModal(false)}
      />

      {/* ── 댓글 삭제 확인 모달 ── */}
      <Modal
        visible={showDeleteCommentModal}
        title="댓글 삭제"
        confirmLoading={isDeletingComment}
        body={
          <>
            <Text className="text-body-sm text-gray-500">댓글을 삭제할까요?</Text>
          </>
        }
        variant="single" // 확인 버튼만 사용
        confirmLabel="삭제하기"
        onConfirm={confirmDeleteComment}
        onDismiss={() => !isDeletingComment && setShowDeleteCommentModal(false)}
      />

      {/* ── 사용자 차단 확인 모달 ── */}
      <Modal
        visible={showBlockModal}
        title="차단하기"
        confirmLoading={isBlocking}
        body={
          <>
            <Text className="text-body-sm text-gray-500">
              이 사용자를 차단하시겠어요?{'\n'}
              차단된 사용자의 게시글과 댓글이 보이지 않습니다.
            </Text>
          </>
        }
        variant="single"
        confirmLabel="차단하기"
        onConfirm={confirmBlockUser}
        onDismiss={() => !isBlocking && setShowBlockModal(false)}
      />

      {/* ── 범용 알림 모달 ── */}
      <Modal
        visible={alertModal !== null}
        title={alertModal?.title ?? ''}
        body={alertModal?.message ?? ''}
        variant="single"
        onConfirm={() => setAlertModal(null)}
        onDismiss={() => setAlertModal(null)}
      />
      <Toast
        message="올바르지 않은 표현을 사용했어요"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}
