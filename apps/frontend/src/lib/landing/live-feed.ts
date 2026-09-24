export function countTrailing<T>(
  values: T[],
  predicate: (value: T) => boolean,
): number {
  const lastMiss = values.findLastIndex((value) => !predicate(value));

  return values.length - 1 - lastMiss;
}
