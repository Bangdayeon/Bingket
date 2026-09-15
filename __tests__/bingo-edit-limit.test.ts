import { disabledBingoCells, editCountKey } from '@/features/bingo/lib/edit-limit';

describe('각 칸에 처음 지정한 수정 횟수 적용', () => {
  it('한 칸의 횟수를 소진해도 다른 칸은 수정할 수 있다', () => {
    expect(disabledBingoCells(1, [1, 0, 0], [0, 0, 0])).toEqual([true, false, false]);
  });
  it('저장 전 수정 횟수도 해당 칸에만 반영한다', () => {
    expect(disabledBingoCells(2, [1, 0, 1], [1, 1, 0])).toEqual([true, false, false]);
  });
  it('수정 불가와 두 무제한 값은 그대로 유지한다', () => {
    expect(disabledBingoCells(0, [0, 0], [0, 0])).toEqual([true, true]);
    for (const max of [-1, 9999]) {
      expect(disabledBingoCells(max, [30, 40], [1, 0])).toEqual([false, false]);
      expect(editCountKey(max)).toBe('무제한');
    }
  });
});
