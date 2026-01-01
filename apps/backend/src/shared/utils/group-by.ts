export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const item of array) {
    const keyValue = item[key] as unknown as string;
    if (!result[keyValue]) {
      result[keyValue] = [];
    }

    result[keyValue].push(item);
  }

  return result;
}
