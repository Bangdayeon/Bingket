import { compareVersion } from '@/lib/compare-version';

describe('compareVersion', () => {
  it('같은 버전은 0', () => {
    expect(compareVersion('1.0.7', '1.0.7')).toBe(0);
  });

  it('자릿수가 달라도 없는 자리는 0 으로 본다', () => {
    expect(compareVersion('1.1', '1.1.0')).toBe(0);
    expect(compareVersion('1.1.0.0', '1.1')).toBe(0);
    expect(compareVersion('1.1', '1.1.1')).toBe(-1);
  });

  it('앞자리가 우선한다', () => {
    expect(compareVersion('1.9.9', '2.0.0')).toBe(-1);
    expect(compareVersion('2.0.0', '1.9.9')).toBe(1);
  });

  it('숫자로 비교한다 (문자열 비교가 아니다)', () => {
    // 문자열로 비교하면 '10' < '9' 가 되어 뒤집힌다
    expect(compareVersion('1.10.0', '1.9.0')).toBe(1);
    expect(compareVersion('1.0.10', '1.0.9')).toBe(1);
  });

  it('0 이 붙어도 숫자로 읽는다', () => {
    expect(compareVersion('1.02.0', '1.2.0')).toBe(0);
  });

  it('숫자가 아닌 조각이 있으면 null', () => {
    expect(compareVersion('1.0.0-beta', '1.0.0')).toBeNull();
    expect(compareVersion('1.0.0', 'v1.0.0')).toBeNull();
    expect(compareVersion('', '1.0.0')).toBeNull();
    expect(compareVersion('1..0', '1.0.0')).toBeNull();
  });

  it('앞뒤 공백은 무시한다', () => {
    expect(compareVersion(' 1.0.7 ', '1.0.7')).toBe(0);
  });
});
