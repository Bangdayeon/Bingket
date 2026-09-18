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
