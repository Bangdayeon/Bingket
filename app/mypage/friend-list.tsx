import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import SearchIcon from '@/assets/icons/ic_search.svg';
import { deleteFriend, fetchFriends, type Friend } from '@/features/battle/lib/battle';
import { setSelectedFriend } from '@/features/battle/lib/battle-selection';
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
import { SearchList } from '@/features/friend/components/SearchList';
import type {
  ConflictModal as ConflictModalType,
  IncomingRequest,
  UserSearchResult,
} from '@/types/friend';
import Button from '@/components/Button';
import Loading from '@/components/Loading';

export default function FriendListScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const insets = useSafeAreaInsets();
  const isSelectMode = mode === 'select';

  const [friendSearch, setFriendSearch] = useState('');

  const [globalSearchMode, setGlobalSearchMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  // Battle request / select friend
  const handleBattleRequest = (friend: Friend) => {
    setSelectedFriend(friend);
    if (isSelectMode) {
      router.back();
    } else {
      router.push({ pathname: '/bingo/battle', params: { fromFriend: 'true' } });
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

  const closeGlobalSearch = () => {
    setGlobalSearchMode(false);
    setGlobalSearch('');
    setSearchResults(null);
    setSearchError(null);
  };

  return (
    <View className="flex-1 bg-white  " style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300  ">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={globalSearchMode ? closeGlobalSearch : () => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">
          {isSelectMode ? '친구 선택' : '친구'}
        </Text>
        <IconButton
          variant="ghost"
          size={32}
          icon={<SearchIcon width={20} height={20} />}
          onClick={() => setGlobalSearchMode(true)}
        />
      </View>

      <View className="px-4 py-2">
        {globalSearchMode ? (
          <TextInput
            value={globalSearch}
            onChangeText={(text) => {
              setGlobalSearch(text);
              if (!text) {
                setSearchResults(null);
                setSearchError(null);
              }
            }}
            onSubmitEditing={() => runSearch(globalSearch)}
            returnKeyType="search"
            placeholder="친구 요청을 보낼 유저의 id/이름을 입력해주세요."
            autoCapitalize="none"
            autoFocus
            leftIcon={<SearchIcon width={16} height={16} />}
          />
        ) : (
          <TextInput
            value={friendSearch}
            onChangeText={setFriendSearch}
            placeholder="친구 목록에서 검색해보세요."
            autoCapitalize="none"
            leftIcon={<SearchIcon width={16} height={16} />}
          />
        )}
      </View>

      {globalSearchMode ? (
        <SearchList
          searchLoading={searchLoading}
          searchError={searchError}
          searchResults={searchResults}
          sending={sending}
          handleRequest={handleRequest}
          insets={insets}
        />
      ) : (
        <>
          <View className="flex flex-row mx-4 mb-2 px-4 py-5 bg-yellow-100 rounded-xl items-center justify-between gap-2">
            <Text className="text-body-sm text-gray-800">
              {'아직 앱을 사용하지 않는 친구가 있나요?\n친구를 초대해서 함께해요.'}
            </Text>
            <Button
              label="친구 초대하기"
              onClick={handleInvite}
              size="sm"
              className="px-3 bg-amber-300"
            />
          </View>

          {listLoading ? (
            <View className="flex-1 items-center justify-center">
              <Loading color="#6ADE50" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
              <ReceivedList
                pendingRequests={pendingRequests}
                handleIncomingResponse={handleIncomingResponse}
              />
              <FriendList
                friends={filteredFriends}
                handleDeleteFriend={handleDeleteFriend}
                handleBattleRequest={handleBattleRequest}
              />
            </ScrollView>
          )}
        </>
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
