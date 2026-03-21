import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput as RNTextInput,
  View,
  useColorScheme,
} from 'react-native';
import { LikeButton } from '@/features/community/components/LikeButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Popover } from '@/components/Popover';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import MoreVertIcon from '@/assets/icons/ic_more_vert.svg';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import { MOCK_COMMUNITY_POSTS } from '@/mocks/community-posts';

// TODO: auth 연동 후 실제 사용자로 교체
const CURRENT_USER = 'user1234';

const HEADER_H = 60;
const ICON_SIZE = 20;

const TYPE_LABELS: Record<string, string> = {
  bingo: '빙고판',
  achievement: '빙고 달성',
  free: '자유게시판',
};

const REPORT_REASONS = [
  '상업적 광고 및 판매',
  '욕설/비하',
  '음란물/성적인 내용',
  '도배',
  '사칭/사기',
  '기타',
];

function Avatar({ size = 30 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-gray-300 border border-gray-300"
    />
  );
}

function BingoGrid({ items }: { items: string[][] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
      {items.flat().map((text, i) => (
        <View
          key={i}
          style={{
            width: '31.3%',
            height: 72,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#D2D6D6' /* gray-300 */,
            backgroundColor: '#FDFDFD' /* white */,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          <Text className="text-body-sm text-center" numberOfLines={2}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */

  const post = MOCK_COMMUNITY_POSTS.find((p) => p.id === id);

  const [comment, setComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900 items-center justify-center">
        <Text className="text-body-lg text-gray-500">게시글을 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const isOwnPost = post.author === CURRENT_USER;

  const menuItems = isOwnPost
    ? [
        { label: '수정하기', onPress: () => router.push(`/community/write`) },
        { label: '삭제하기', danger: true as const, onPress: () => {} },
      ]
    : [
        { label: '신고하기', onPress: () => setShowReportModal(true) },
        { label: '차단하기', danger: true as const, onPress: () => {} },
      ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      {/* 헤더 */}
      <View
        className="flex-row items-center border-b border-gray-300 dark:border-gray-700"
        style={{ height: HEADER_H }}
      >
        <View style={{ width: 56 }} className="pl-4">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowBackIcon width={20} height={20} color={iconColor} />
          </Pressable>
        </View>
        <Text className="flex-1 text-title-sm text-center">{TYPE_LABELS[post.type]}</Text>
        <View style={{ width: 56 }} className="pr-4 items-end">
          <Pressable onPress={() => setShowMenu((v) => !v)} hitSlop={8}>
            <MoreVertIcon width={24} height={24} color={iconColor} />
          </Pressable>
        </View>
      </View>

      {/* 팝오버 메뉴 */}
      <Popover
        visible={showMenu}
        items={menuItems}
        onDismiss={() => setShowMenu(false)}
        style={{ top: HEADER_H + 8, right: 16 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.bottom}
      >
        {/* 본문 스크롤 영역 */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-5 pt-4">
            {/* 작성자 정보 */}
            <View className="flex-row items-center gap-2">
              <Avatar />
              <Text className="text-label-sm">{post.author}</Text>
              <Text className="text-caption-sm" style={{ color: '#181C1C' /* gray-900 */ }}>
                •
              </Text>
              <Text className="text-caption-sm" style={{ color: '#929898' /* gray-500 */ }}>
                {post.timeAgo}
              </Text>
            </View>

            {/* 제목 */}
            <Text className="text-title-md mt-3">{post.title}</Text>

            {/* 빙고 그리드 */}
            {post.bingoItems && <BingoGrid items={post.bingoItems} />}

            {/* 본문 */}
            <Text className="text-body-sm mt-3">{post.body}</Text>

            {/* 좋아요 / 댓글 */}
            <View className="flex-row items-center gap-4 mt-3">
              <LikeButton count={post.likeCount} iconColor={iconColor} />

              <View className="flex-row items-center gap-1">
                <SMSIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />
                <Text className="text-body-sm">{post.commentCount}</Text>
              </View>
            </View>
          </View>

          {/* 구분선 */}
          <View className="h-px bg-gray-300 dark:bg-gray-700 mt-4" />

          {/* 댓글 빈 상태 */}
          <View className="items-center py-16 gap-3">
            <View style={{ width: 60, height: 60, opacity: 0.25 }}>
              <SMSIcon width={60} height={60} color={iconColor} />
            </View>
            <Text className="text-body-md" style={{ color: '#929898' /* gray-500 */ }}>
              첫 댓글을 남겨주세요.
            </Text>
          </View>
        </ScrollView>

        {/* 댓글 입력 바 */}
        <View
          className="flex-row items-center px-5 gap-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          style={{ paddingBottom: insets.bottom + 8, paddingTop: 8 }}
        >
          <Avatar size={24} />
          <View
            className="flex-1 flex-row items-center rounded-full px-4"
            style={{ height: 40, backgroundColor: '#E8FAFE' /* sky-100 */ }}
          >
            <RNTextInput
              value={comment}
              onChangeText={setComment}
              placeholder="댓글을 입력하세요."
              placeholderTextColor="#929898" /* gray-500 */
              style={{
                flex: 1,
                fontSize: 14,
                lineHeight: 18,
                color: isDark ? '#F6F7F7' : '#181C1C' /* gray-100 : gray-900 */,
              }}
            />
            <Pressable hitSlop={8} onPress={() => setComment('')}>
              <Text
                style={{
                  color: comment.trim() ? '#28C8DE' /* sky-500 */ : '#929898' /* gray-500 */,
                  fontSize: 18,
                  lineHeight: 20,
                }}
              >
                ▶
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 신고하기 모달 */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
          }}
          onPress={() => setShowReportModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#FDFDFD' /* white */,
              borderRadius: 30,
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 20,
              width: '100%',
              maxWidth: 300,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 5,
              elevation: 5,
            }}
          >
            <Text className="text-title-sm mb-4">신고하기</Text>

            {REPORT_REASONS.map((reason) => (
              <Pressable
                key={reason}
                onPress={() => setSelectedReason(reason)}
                className="flex-row items-center gap-3 py-2"
              >
                {/* 라디오 버튼 */}
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor:
                      selectedReason === reason
                        ? '#28C8DE' /* sky-500 */
                        : '#D2D6D6' /* gray-300 */,
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
                        backgroundColor: '#28C8DE' /* sky-500 */,
                      }}
                    />
                  )}
                </View>
                <Text className="text-body-md">{reason}</Text>
              </Pressable>
            ))}

            <View className="flex-row gap-3 mt-5">
              <Pressable
                onPress={() => setShowReportModal(false)}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: '#D2D6D6' /* gray-300 */,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="text-label-sm">취소하기</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  // TODO: 신고 API 호출
                  setShowReportModal(false);
                  setSelectedReason(null);
                }}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: '#EC5858' /* red-400 */,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: selectedReason ? 1 : 0.5,
                }}
                disabled={!selectedReason}
              >
                <Text className="text-label-sm" style={{ color: '#FDFDFD' /* white */ }}>
                  신고하기
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
