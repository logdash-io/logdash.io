export const arrayToObject = <T>(array: T[], key: keyof T): Record<string, T> =>
  Object.fromEntries(array.map((item) => [String(item[key]), item]));
