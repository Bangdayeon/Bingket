import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
      setErrorMessage(e instanceof Error ? e.message : t('friends.loadFailed'));
    } finally {
      setListLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLists();
  }, [loadLists]);

  // Search
  const runSearch = useCallback(
    async (keyword: string) => {
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
        setSearchError(e instanceof Error ? e.message : t('friends.searchFailed'));
      } finally {
        setSearchLoading(false);
      }
    },
    [t],
  );

  const handleFriendSearchChange = (value: string) => {
    setFriendSearch(value);

    if (value.trim().length < 2) {
      setSearchResults(null);
      setSearchError(null);
    }
  };

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
      setErrorMessage(e instanceof Error ? e.message : t('friends.requestFailed'));
    } finally {
      setSending(null);
    }
  };

  // Accept/reject incoming request
  const handleIncomingResponse = async (requestId: string, accept: boolean) => {
    try {
      await respondToFriendRequest(requestId, accept);

      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));

      if (accept) {
        await loadLists();
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : t('friends.processFailed'));
    }
  };

  // Conflict modal response
  const handleConflictResponse = async (accept: boolean) => {
    if (!conflictModal) return;

    await handleIncomingResponse(conflictModal.requestId, accept);
    setConflictModal(null);
  };

  // Delete friend
  const handleDeleteFriend = (friend: Friend) => {
    setDeletingFriend(friend);
  };

  const confirmDeleteFriend = async () => {
    if (!deletingFriend) return;

    try {
      await deleteFriend(deletingFriend.friendId);

      setFriends((prev) => prev.filter((f) => f.friendId !== deletingFriend.friendId));
    } catch {
      setErrorMessage(t('friends.deleteFailed'));
    } finally {
      setDeletingFriend(null);
    }
  };

  const APP_STORE_URL = 'https://apps.apple.com/kr/app/%EB%B9%99%ED%82%B7-bingket/id6761634987';

  const handleInvite = async () => {
    try {
      const { default: KakaoShareLink } = await import('react-native-kakao-share-link');

      await KakaoShareLink.sendFeed({
        content: {
          title: t('friends.inviteShareTitle'),
          description: t('friends.inviteShareDescription'),
          imageUrl: 'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/etc/og_image.png',
          link: {
            webUrl: APP_STORE_URL,
            mobileWebUrl: APP_STORE_URL,
          },
        },
        buttons: [
          {
            title: t('friends.openApp'),
            link: {
              androidExecutionParams: [{ key: 'screen', value: 'invite' }],
              iosExecutionParams: [{ key: 'screen', value: 'invite' }],
            },
          },
        ],
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : t('friends.inviteFailed'));
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

  useEffect(() => {
    const keyword = friendSearch.trim();

    if (keyword.length < 2) return;

    const timer = setTimeout(() => void runSearch(keyword), 400);

    return () => clearTimeout(timer);
  }, [friendSearch, runSearch]);

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader
        title={isSelectMode ? t('friends.select') : t('friends.friend')}
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
              <Text className="text-body-md font-pretendard-medium text-green-600">
                {t('friends.complete')}
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {isSelectMode && pickedFriends.length === 0 && (
        <Text className="px-4 pb-4 text-body-sm text-gray-500">{t('friends.selectFriend')}</Text>
      )}

      {isSelectMode && pickedFriends.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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

      <View className="px-4 pb-4">
        <SearchInput
          value={friendSearch}
          onChangeText={handleFriendSearchChange}
          onSubmitEditing={() => void runSearch(friendSearch)}
          returnKeyType="search"
          placeholder={t('friends.searchPlaceholder')}
          maxLength={LIMITS.searchKeyword}
          autoCapitalize="none"
          onClear={clearSearch}
        />
      </View>

      <View className="mx-4 mb-2 h-16 flex-row items-center justify-between gap-2 rounded-2xl bg-green-100 px-4">
        <Text className="text-body-sm text-gray-800">{t('friends.inviteMessage')}</Text>

        <Button label={t('friends.invite')} onClick={handleInvite} size="sm" />
      </View>

      {listLoading ? (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 16,
          }}
        >
          <ReceivedList
            pendingRequests={pendingRequests}
            handleIncomingResponse={handleIncomingResponse}
          />

          <CollapsibleSection
            title={t('friends.friend')}
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
                  : router.push({
                      pathname: '/profile/[id]',
                      params: { id: friend.friendId },
                    })
              }
            />
          </CollapsibleSection>

          {friendSearch.trim().length >= 2 && (
            <CollapsibleSection
              title={t('friends.allUsers')}
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
                  router.push({
                    pathname: '/profile/[id]',
                    params: { id: item.id },
                  })
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
