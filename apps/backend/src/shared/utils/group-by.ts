export function groupBy<K extends PropertyKey, T extends Record<K, string>>(
  array: T[],
  key: K,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const item of array) {
    const keyValue = item[key];
    if (!result[keyValue]) {
      result[keyValue] = [];
    }

    result[keyValue].push(item);
  }

  return result;
}
