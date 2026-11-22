export function slotLefts(
  widths: number[],
  origin: number,
  gap: number,
): number[] {
  return widths.reduce(
    (lefts, width) => [...lefts, lefts[lefts.length - 1] + width + gap],
    [origin],
  );
}

export function dropOrder<T>(
  order: T[],
  value: T,
  lefts: number[],
  left: number,
): T[] {
  const index = lefts.reduce(
    (best, slot, at) =>
      Math.abs(slot - left) < Math.abs(lefts[best] - left) ? at : best,
    0,
  );
  const others = order.filter((one) => one !== value);
  return [...others.slice(0, index), value, ...others.slice(index)];
}
