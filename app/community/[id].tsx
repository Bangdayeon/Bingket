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
import { PostHeader } from '@/features/community/components/PostHeader';
import { HEADER_HEIGHT } from '@/lib/layout';
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
  COMMENT_PAGE_SIZE,
} from '@/features/community/lib/community';
import { checkAndAwardBadges } from '@/lib/badge-checker';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { containsBadWord } from '@/constants/bad-words';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useOnlineRestore } from '@/lib/use-online';
import { useTranslation } from 'react-i18next';

const REPORT_REASON_KEYS = [
  'community.reportReasonAd',
  'community.reportReasonAbuse',
  'community.reportReasonSexual',
  'community.reportReasonSpam',
  'community.reportReasonImpersonation',
  'community.reportReasonOther',
] as const;

export default function CommunityDetailScreen() {
  const { t } = useTranslation();

  const REPORT_REASONS = REPORT_REASON_KEYS.map((key) => t(key));

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [keyboardShown, setKeyboardShown] = useState(false);

  // MODAL STATE
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

  const [postFailed, setPostFailed] = useState(false);
  const [commentsFailed, setCommentsFailed] = useState(false);

  const loadPost = useCallback(() => {
    if (!id) return;
    setPostLoading(true);
    setPostFailed(false);
    fetchPost(id)
      .then(setPost)
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setPostFailed(true);
      })
      .finally(() => setPostLoading(false));
  }, [id]);

  useFocusEffect(loadPost);

  // awayas get limit, if add 'see more', not move anony num
  const [commentLimit, setCommentLimit] = useState(COMMENT_PAGE_SIZE);
  const [commentTotal, setCommentTotal] = useState(0);

  const loadComments = useCallback(() => {
    if (!id) return;
    setCommentsLoading(true);
    setCommentsFailed(false);
    fetchComments(id, commentLimit)
      .then((page) => {
        setLocalComments(page.comments);
        setCommentTotal(page.total);
      })
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setCommentsFailed(true);
      })
      .finally(() => setCommentsLoading(false));
  }, [id, commentLimit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComments();
  }, [loadComments]);

  useOnlineRestore(() => {
    if (postFailed) loadPost();
    if (commentsFailed) loadComments();
  });

  const refreshComments = useCallback(async () => {
    if (!id) return;
    const page = await fetchComments(id, commentLimit);
    setLocalComments(page.comments);
    setCommentTotal(page.total);
    setPost((prev) => (prev ? { ...prev, commentCount: page.total } : prev));
  }, [id, commentLimit]);

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
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <View
          className="flex-row items-center border-b border-gray-300  "
          style={{ height: HEADER_HEIGHT }}
        >
          <View style={{ width: 56 }} className="pl-4">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <ArrowBackIcon width={24} height={24} className="text-gray-700" />
            </Pressable>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <View
          className="flex-row items-center border-b border-gray-300  "
          style={{ height: HEADER_HEIGHT }}
        >
          <View style={{ width: 56 }} className="pl-4">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <ArrowBackIcon width={24} height={24} className="text-gray-700" />
            </Pressable>
          </View>
        </View>
        {postFailed ? (
          <ErrorState onRetry={loadPost} />
        ) : (
          <EmptyState message={t('community.postNotFound')} />
        )}
      </SafeAreaView>
    );
  }

  const isOwnPost = post.userId === currentUserId;

  // ── Handlers ─────────────────────────────────────

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
        title: t('community.postDeleteFailTitle'),
        message: e instanceof Error ? e.message : t('community.postDeleteFail'),
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
        title: t('common.error.general'),
        message: e instanceof Error ? e.message : t('community.commentAddFail'),
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
        title: t('common.error.general'),
        message: e instanceof Error ? e.message : t('community.commentDeleteFail'),
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
      setAlertModal({
        title: t('community.blockSuccessTitle'),
        message: t('community.blockSuccessBody'),
      });
    } catch (e) {
      setShowBlockModal(false);
      setBlockTargetUserId(null);
      setAlertModal({
        title: t('common.error.general'),
        message: e instanceof Error ? e.message : t('community.blockFail'),
      });
    } finally {
      setIsBlocking(false);
    }
  };

  // ── Popover menu items ─────────────────────────────────────
  const postMenuItems = isOwnPost
    ? [
        {
          label: t('community.editPost'),
          onPress: () => {
            setShowPostMenu(false);
            router.push({
              pathname: '/community/write',
              params: {
                postId: post.id,
                initTitle: post.title,
                initContent: post.body,
                initImageUrls: JSON.stringify(post.imageUrls ?? []),
                initBingo: post.bingo ? JSON.stringify(post.bingo) : undefined,
                initIsAnonymous: post.isAnonymous ? '1' : '0',
              },
            });
          },
        },
        {
          label: t('community.deletePost'),
          danger: true as const,
          onPress: () => {
            setShowPostMenu(false);
            setShowDeleteModal(true);
          },
        },
      ]
    : [
        {
          label: t('community.report'),
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
                label: t('community.blockUser'),
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
          label: t('common.delete'),
          danger: true as const,
          onPress: () => commentMenuId && handleDeleteComment(commentMenuId),
        },
      ]
    : [
        {
          label: t('community.report'),
          onPress: () => {
            if (commentMenuId) setReportTarget({ type: 'comment', id: commentMenuId });
            setCommentMenuId(null);
            setShowReportModal(true);
          },
        },
        {
          label: t('community.blockUser'),
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
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <PostHeader onBack={() => router.back()} onMenuPress={() => setShowPostMenu((v) => !v)} />

      <Popover
        visible={showPostMenu}
        items={postMenuItems}
        onDismiss={() => setShowPostMenu(false)}
        style={{ top: HEADER_HEIGHT + 8, right: 16 }}
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
          <PostBody post={post} />
          <CommentSection
            comments={localComments}
            postAuthorId={post.userId}
            onMenuPress={handleCommentMenuPress}
            onReplyPress={(replyId, author) => setReplyTo({ id: replyId, author })}
            isLoading={commentsLoading}
            hasError={commentsFailed}
            onRetry={loadComments}
            hasMore={commentTotal > commentLimit}
            onLoadMore={() => setCommentLimit((n) => n + COMMENT_PAGE_SIZE)}
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

      {/* ── Report modal ── */}
      <Modal
        visible={showReportModal}
        confirmLoading={isReporting}
        title={t('community.report')}
        body={
          <View className="gap-3">
            <Text className="text-body-sm text-gray-700">{t('community.reportExplanation')}</Text>
            {/* Options don't inherit the outer gap-3. Each row uses py-1.5 for 12px
                spacing while keeping a 32px touch target. */}
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
        variant="warning" // Uses both a danger confirm button and a cancel button
        confirmLabel={t('community.report')}
        cancelLabel={t('common.cancel')}
        onConfirm={async () => {
          if (!selectedReason || !reportTarget) return;
          setIsReporting(true);
          try {
            await submitReport(reportTarget.type, reportTarget.id, selectedReason);
            setShowReportModal(false);
            setSelectedReason(null);
            setReportTarget(null);
            setAlertModal({
              title: t('community.reportSuccessTitle'),
              message: t('community.reportSuccessBody'),
            });
          } catch (e) {
            setAlertModal({
              title: t('common.error.general'),
              message: e instanceof Error ? e.message : t('community.reportFail'),
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

      {/* ── Post delete confirmation modal ── */}
      <Modal
        visible={showDeleteModal}
        title={t('community.deletePostConfirmTitle')}
        confirmLoading={isDeleting}
        body={
          <>
            <Text className="text-body-sm text-gray-500">
              {t('community.deletePostConfirmBody')}
            </Text>
          </>
        }
        // 'error' keeps a single button but makes the confirm button danger-colored.
        // 'single' is primary (green), which didn't visually warn for an irreversible action.
        variant="error"
        confirmLabel={t('common.delete')}
        onConfirm={handleDeletePost}
        onDismiss={() => !isDeleting && setShowDeleteModal(false)}
      />

      {/* ── Comment delete confirmation modal ── */}
      <Modal
        visible={showDeleteCommentModal}
        title={t('community.deleteCommentTitle')}
        confirmLoading={isDeletingComment}
        body={
          <>
            <Text className="text-body-sm text-gray-500">{t('community.deleteCommentBody')}</Text>
          </>
        }
        variant="error" // Single confirm button, styled danger
        confirmLabel={t('common.delete')}
        onConfirm={confirmDeleteComment}
        onDismiss={() => !isDeletingComment && setShowDeleteCommentModal(false)}
      />

      {/* ── Block user confirmation modal ── */}
      <Modal
        visible={showBlockModal}
        title={t('community.blockUser')}
        confirmLoading={isBlocking}
        body={
          <>
            <Text className="text-body-sm text-gray-500">
              {t('community.blockUserConfirmBody')}
            </Text>
          </>
        }
        variant="error" // Single danger button
        confirmLabel={t('community.block')}
        onConfirm={confirmBlockUser}
        onDismiss={() => !isBlocking && setShowBlockModal(false)}
      />

      {/* ── Generic alert modal ── */}
      <Modal
        visible={alertModal !== null}
        title={alertModal?.title ?? ''}
        body={alertModal?.message ?? ''}
        variant="single"
        onConfirm={() => setAlertModal(null)}
        onDismiss={() => setAlertModal(null)}
      />
      <Toast
        message={t('community.badWordToast')}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}
