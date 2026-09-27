export function getUniqueObjects<T>(items: T[], keyBuilder: (item: T) => string): T[] {
  const uniqueMap = new Map<string, T>();

  items.forEach((item) => {
    const key = keyBuilder(item);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return Array.from(uniqueMap.values());
}
