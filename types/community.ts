export interface CommunityPost {
  id: string;
  author: string;
  timeAgo: string;
  body: string;
  likeCount: number;
  commentCount: number;
  type: 'bingo' | 'achievement' | 'free';
  bingoItems?: string[][];
}
