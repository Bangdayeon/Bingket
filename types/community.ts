export interface CommunityPost {
  id: string;
  title: string;
  author: string;
  timeAgo: string;
  body: string;
  likeCount: number;
  commentCount: number;
  type: 'bingo' | 'achievement' | 'free';
  bingoItems?: string[][];
}
