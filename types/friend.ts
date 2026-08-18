/** 맺어진 친구 관계. rowId는 friends 테이블의 행 id */
export type Friend = {
  rowId: string;
  friendId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ConflictModal = {
  requestId: string;
  senderDisplayName: string;
};

export type IncomingRequest = {
  id: string;
  senderId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type UserSearchResult = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_friend: boolean;
  request_status: string | null;
};
