import type { BingoData, BingoTheme } from './bingo';

export type PostCategory = 'bingo_board' | 'bingo_achieve' | 'free';

/** 게시글 작성/수정 에디터 블록 타입 */
export type EditorBlock =
  | { id: string; type: 'text'; value: string }
  | { id: string; type: 'image'; uri: string; mimeType: string }
  | { id: string; type: 'existing-image'; url: string }
  | { id: string; type: 'bingo'; bingo: BingoData };

/** DB에 저장되는 content JSON 블록 타입 */
export type StoredBlock =
  | { type: 'text'; value: string }
  | { type: 'image'; index: number }
  | { type: 'bingo' };

export interface CommentReply {
  id: string;
  userId: string;
  author: string;
  isAnonymous: boolean;
  avatarUrl?: string | null;
  body: string;
  createdAt: string;
  likeCount: number;
  likedByMe?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  author: string;
  isAnonymous: boolean;
  avatarUrl?: string | null;
  body: string;
  createdAt: string;
  likeCount: number;
  isDeleted?: boolean;
  replies?: CommentReply[];
  likedByMe?: boolean;
}

export interface CommunityUser {
  id: string;
  username: string;
  is_deleted: boolean;
}

export interface CommunityPost {
  id: string;
  title: string;
  userId: string;
  author: string;
  isAnonymous: boolean;
  avatarUrl?: string | null;
  timeAgo: string;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  category: PostCategory;
  bingo?: {
    /** bingo_board row id (snapshot 빙고엔 없음) */
    id?: string;
    title?: string;
    cells: string[];
    grid: string;
    theme: BingoTheme;
  };
  imageUrls?: string[];
  user?: CommunityUser;
}
