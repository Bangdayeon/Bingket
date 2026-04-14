import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
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
import Loading from '@/components/Loading';

export default function FriendListScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const insets = useSafeAreaInsets();
  const isSelectMode = mode === 'select';

  const [search, setSearch] = useState('');
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

  useEffect(() => {
    const t = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, runSearch]);

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
      router.push('/bingo/battle');
    }
  };

  const isSearching = search.trim().length > 0;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300 dark:border-gray-700">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">
          {isSelectMode ? '친구 선택' : '친구'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <View className="px-4 py-2">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="id로 친구를 검색해보세요"
          autoCapitalize="none"
        />
      </View>

      {isSearching ? (
        <SearchList
          searchLoading={searchLoading}
          searchError={searchError}
          searchResults={searchResults}
          sending={sending}
          handleRequest={handleRequest}
          insets={insets}
        />
      ) : listLoading ? (
        <View className="flex-1 items-center justify-center">
          <Loading color="6ADE50" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          <ReceivedList
            pendingRequests={pendingRequests}
            handleIncomingResponse={handleIncomingResponse}
          />
          <FriendList
            friends={friends}
            handleDeleteFriend={handleDeleteFriend}
            handleBattleRequest={handleBattleRequest}
          />
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
