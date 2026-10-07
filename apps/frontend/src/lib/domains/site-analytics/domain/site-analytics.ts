export const SITE_ANALYTICS_ID = '6ac4712646e01d0c0d69fd4d';

export function neutralPath(path: string): string {
  if (path.startsWith('/for/')) {
    return '/for/[address]';
  }

  return path.replace(/\/[a-f\d]{24}(?=\/|$)/gi, '/[id]');
}
