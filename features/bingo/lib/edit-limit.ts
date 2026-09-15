export const isUnlimitedEdits = (maxEdits: number): boolean => maxEdits === -1 || maxEdits === 9999;

export const disabledBingoCells = (
  maxEdits: number,
  original: number[],
  pending: number[],
): boolean[] => {
  return original.map(
    (count, index) => !isUnlimitedEdits(maxEdits) && count + (pending[index] ?? 0) >= maxEdits,
  );
};

export const editCountKey = (maxEdits: number): string =>
  isUnlimitedEdits(maxEdits) ? '무제한' : String(maxEdits);
