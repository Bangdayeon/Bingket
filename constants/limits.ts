/**
 * 사용자 입력 길이 상한. 화면과 DB CHECK 제약이 같은 값을 본다.
 *
 * 상한이 없으면 목록 카드에서 긴 제목이 옆 아이콘을 화면 밖으로 밀어내고,
 * 댓글 하나가 상세 화면을 무한정 늘린다. 표시(numberOfLines)만으로는
 * 저장되는 값을 막지 못하므로 입력 단계에서 자른다.
 */
export const LIMITS = {
  postTitle: 50,
  postContent: 5000,
  comment: 500,
  bingoTitle: 20,
  bingoCell: 30,
  searchKeyword: 30,
  // 이미 적용돼 있던 값들. 한곳에서 보이도록 함께 둔다.
  memo: 300,
  retrospective: 500,
  bio: 50,
  displayName: 12,
  username: 20,
} as const;
