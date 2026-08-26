/**
 * 점으로 구분된 숫자 버전을 비교한다. (예: '1.0.7')
 *
 * 자릿수가 다르면 없는 자리를 0 으로 본다 -- '1.1' 과 '1.1.0' 은 같다.
 * 숫자로 읽을 수 없는 조각이 하나라도 있으면 null 을 돌려준다.
 * 호출부는 null 을 "판단할 수 없음" 으로 보고 통과시켜야 한다.
 * 버전 문자열이 이상하다고 앱을 막아버리면 안 되기 때문이다.
 *
 * @returns a < b 면 -1, 같으면 0, a > b 면 1. 비교 불가면 null
 */
export function compareVersion(a: string, b: string): -1 | 0 | 1 | null {
  const parse = (v: string): number[] | null => {
    const parts = v.trim().split('.');
    const nums: number[] = [];
    for (const part of parts) {
      if (!/^\d+$/.test(part)) return null;
      nums.push(Number(part));
    }
    return nums.length > 0 ? nums : null;
  };

  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return null;

  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    if (l < r) return -1;
    if (l > r) return 1;
  }
  return 0;
}
