export function getUniqueObjects<T>(
  items: T[],
  keyBuilder: (T) => string,
): T[] {
  const uniqueMap = new Map();

  items.forEach((item) => {
    const key = keyBuilder(item);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return Array.from(uniqueMap.values());
}
