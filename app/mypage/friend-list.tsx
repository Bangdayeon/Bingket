import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import CloseIcon from '@/assets/icons/ic_close.svg';
import { friendSelection, useFriendSelection } from '@/features/team/lib/friend-selection';
import { TEAM_MAX_MEMBERS } from '@/types/team';
import { SearchInput } from '@/components/SearchInput';
import { PageHeader } from '@/components/PageHeader';
import { deleteFriend, fetchFriends } from '@/features/friend/lib/friend';
import type { Friend } from '@/types/friend';
import {
  checkIncomingConflict,
  fetchIncomingRequests,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
} from '@/features/friend/lib/friend';
import { ConflictModal } from '@/features/friend/components/ConflictModal';
import { DeleteFriendModal } from '@/features/friend/components/DeleteFriendModal';
import { ErrorModal } from '@/features/friend/components/ErrorModal';
import { FriendList } from '@/features/friend/components/FriendList';
import { ReceivedList } from '@/features/friend/components/ReceivedList';
import { CollapsibleSection } from '@/features/friend/components/CollapsibleSection';
import { SearchList } from '@/features/friend/components/SearchList';
import type {
  ConflictModal as ConflictModalType,
  IncomingRequest,
  UserSearchResult,
} from '@/types/friend';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import { LIMITS } from '@/constants/limits';

export default function FriendListScreen() {
  const router = useRouter();
  const { mode, max } = useLocalSearchParams<{ mode?: string; max?: string }>();
  const insets = useSafeAreaInsets();
  const isSelectMode = mode === 'select';
  const maxSelect = Number(max) || TEAM_MAX_MEMBERS - 1;
  const picked = useFriendSelection();

  const [friendSearch, setFriendSearch] = useState('');

  const [searchResults, setSearchResults] = useState<UserSearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 두 목록은 항상 함께 보인다. 제목 옆 `>` 로 각각 접었다 편다.
  const [friendsExpanded, setFriendsExpanded] = useState(true);
  const [othersExpanded, setOthersExpanded] = useState(true);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<IncomingRequest[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [sending, setSending] = useState<string | null>(null);
  const [conflictModal, setConflictModal] = useState<ConflictModalType | null>(null);
  const [deletingFriend, setDeletingFriend] = useState<Friend | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    setListLoading(true);
    try {
      const [friendsData, incomingData] = await Promise.all([
        fetchFriends(),
        fetchIncomingRequests(),
      ]);
      setFriends(friendsData);
      setPendingRequests(incomingData);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '데이터를 불러오지 못했어요.');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Search
  const runSearch = useCallback(async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      setSearchResults(await searchUsers(trimmed));
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '검색에 실패했어요.');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Send friend request
  const handleRequest = async (item: UserSearchResult) => {
    setSending(item.id);
    try {
      const conflict = await checkIncomingConflict(item.id);
      if (conflict) {
        setConflictModal(conflict);
        return;
      }

      await sendFriendRequest({
        receiverId: item.id,
        receiverDisplayName: item.display_name,
        existingStatus: item.request_status,
      });

      setSearchResults((prev) =>
        prev ? prev.map((r) => (r.id === item.id ? { ...r, request_status: 'pending' } : r)) : prev,
      );
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '친구 요청에 실패했어요.');
    } finally {
      setSending(null);
    }
  };

  // Accept/reject incoming request
  const handleIncomingResponse = async (requestId: string, accept: boolean) => {
    try {
      await respondToFriendRequest(requestId, accept);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (accept) await loadLists();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '처리에 실패했어요.');
    }
  };

  // Conflict modal response
  const handleConflictResponse = async (accept: boolean) => {
    if (!conflictModal) return;
    await handleIncomingResponse(conflictModal.requestId, accept);
    setConflictModal(null);
  };

  // Delete friend
  const handleDeleteFriend = (friend: Friend) => setDeletingFriend(friend);

  const confirmDeleteFriend = async () => {
    if (!deletingFriend) return;
    try {
      await deleteFriend(deletingFriend.friendId);
      setFriends((prev) => prev.filter((f) => f.friendId !== deletingFriend.friendId));
    } catch {
      setErrorMessage('친구 삭제에 실패했어요.');
    } finally {
      setDeletingFriend(null);
    }
  };

  const APP_STORE_URL = 'https://apps.apple.com/kr/app/%EB%B9%99%ED%82%B7-bingket/id6761634987';

  const handleInvite = async () => {
    try {
      // 네이티브 모듈 초기화가 화면 진입 시점에 일어나지 않도록 버튼 클릭 시에만 로드
      const { default: KakaoShareLink } = await import('react-native-kakao-share-link');

      await KakaoShareLink.sendFeed({
        content: {
          title: '빙킷에서 친구와 목표를 함께 이뤄봐요!',
          description: '빙고 형태로 목표를 세우고 커뮤니티에서 함께 달성해보세요.',
          imageUrl: 'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/etc/og_image.png',
          link: {
            webUrl: APP_STORE_URL,
            mobileWebUrl: APP_STORE_URL,
          },
        },
        buttons: [
          {
            title: '앱에서 열기',
            link: {
              androidExecutionParams: [{ key: 'screen', value: 'invite' }],
              iosExecutionParams: [{ key: 'screen', value: 'invite' }],
            },
          },
        ],
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '초대 링크 공유에 실패했어요.');
    }
  };

  const filteredFriends = friendSearch.trim()
    ? friends.filter(
        (f) =>
          f.username.toLowerCase().includes(friendSearch.trim().toLowerCase()) ||
          f.displayName.toLowerCase().includes(friendSearch.trim().toLowerCase()),
      )
    : friends;

  const pickedFriends = picked
    .map((id) => friends.find((f) => f.friendId === id))
    .filter((f): f is Friend => Boolean(f));

  const clearSearch = () => {
    setFriendSearch('');
    setSearchResults(null);
    setSearchError(null);
  };

  // 입력이 멎으면 전체 사용자에서도 찾아 아래 '전체 유저'에 붙인다.
  useEffect(() => {
    const keyword = friendSearch.trim();
    if (keyword.length < 2) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }
    const timer = setTimeout(() => void runSearch(keyword), 400);
    return () => clearTimeout(timer);
  }, [friendSearch, runSearch]);

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader
        title={isSelectMode ? '친구 선택' : '친구'}
        titleRight={
          isSelectMode ? (
            <Text className="text-body-md text-gray-600">
              {picked.length}/{maxSelect}
            </Text>
          ) : (
            <Text className="text-body-md text-gray-600">{friends.length}</Text>
          )
        }
        right={
          isSelectMode ? (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-body-md font-pretendard-medium text-green-600">완료</Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* 고르기로 들어왔을 때만: 검색창 위에 고른 사람을 띄운다 */}
      {isSelectMode && pickedFriends.length === 0 && (
        <Text className="px-4 pb-4 text-body-sm text-gray-500">
          함께할 친구를 골라주세요. 고른 사람이 여기에 보여요.
        </Text>
      )}
      {isSelectMode && pickedFriends.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // 아바타(32) + 이름 한 줄이 들어갈 만큼만. 여백을 크게 두면 검색창이
          // 화면 아래로 밀려난다. 위쪽 6은 x 배지가 아바타 밖으로 나가서 필요하다.
          contentContainerStyle={{
            gap: 12,
            paddingHorizontal: 16,
            paddingTop: 6,
            paddingBottom: 8,
          }}
        >
          {pickedFriends.map((friend) => (
            <View key={friend.friendId} className="w-[52px] items-center gap-1">
              <View>
                <ProfileAvatar avatarUrl={friend.avatarUrl} size={32} />
                <Pressable
                  onPress={() => friendSelection.toggle(friend.friendId, maxSelect)}
                  hitSlop={8}
                  className="absolute -right-1 -top-1 rounded-full bg-gray-300"
                >
                  <CloseIcon width={16} height={16} className="text-gray-800" />
                </Pressable>
              </View>
              <Text className="text-caption-sm text-gray-700" numberOfLines={1}>
                {friend.displayName}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 검색창 하나가 위 '친구'를 거르고, 동시에 아래 '전체 유저'를 채운다. */}
      <View className="px-4 pb-4">
        <SearchInput
          value={friendSearch}
          onChangeText={setFriendSearch}
          onSubmitEditing={() => void runSearch(friendSearch)}
          returnKeyType="search"
          placeholder="검색어"
          maxLength={LIMITS.searchKeyword}
          autoCapitalize="none"
          onClear={clearSearch}
        />
      </View>

      <View className="mx-4 mb-2 h-16 flex-row items-center justify-between gap-2 rounded-2xl bg-green-100 px-4">
        <Text className="text-body-sm text-gray-800">
          {'아직 앱을 사용하지 않는 친구가 있나요?\n친구를 초대해서 함께해요.'}
        </Text>
        <Button label="초대하기" onClick={handleInvite} size="sm" />
      </View>

      {listLoading ? (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          <ReceivedList
            pendingRequests={pendingRequests}
            handleIncomingResponse={handleIncomingResponse}
          />

          <CollapsibleSection
            title="친구"
            count={filteredFriends.length}
            expanded={friendsExpanded}
            onToggle={() => setFriendsExpanded((v) => !v)}
          >
            <FriendList
              friends={filteredFriends}
              searching={friendSearch.trim().length > 0}
              handleDeleteFriend={handleDeleteFriend}
              selectable={isSelectMode}
              selectedIds={picked}
              handleProfilePress={(friend) =>
                isSelectMode
                  ? friendSelection.toggle(friend.friendId, maxSelect)
                  : router.push({ pathname: '/profile/[id]', params: { id: friend.friendId } })
              }
            />
          </CollapsibleSection>

          {/* 검색 중일 때만 의미가 있어서, 검색어가 있을 때만 그린다. */}
          {friendSearch.trim().length >= 2 && (
            <CollapsibleSection
              title="전체 유저"
              expanded={othersExpanded}
              onToggle={() => setOthersExpanded((v) => !v)}
            >
              <SearchList
                searchLoading={searchLoading}
                searchError={searchError}
                searchResults={searchResults}
                sending={sending}
                handleRequest={handleRequest}
                handleProfilePress={(item) =>
                  router.push({ pathname: '/profile/[id]', params: { id: item.id } })
                }
              />
            </CollapsibleSection>
          )}
        </ScrollView>
      )}

      <ConflictModal
        conflictModal={conflictModal}
        handleConflictResponse={handleConflictResponse}
      />
      <ErrorModal message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      <DeleteFriendModal
        friend={deletingFriend}
        onConfirm={confirmDeleteFriend}
        onDismiss={() => setDeletingFriend(null)}
      />
    </View>
  );
}
