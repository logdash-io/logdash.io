const BASE = 'http://x.invalid';

/**
 * Only same-origin paths are safe to feed into `redirect()`. The path is
 * resolved the way a browser resolves a `Location` header, so tabs, newlines,
 * backslashes and dot segments cannot turn it into `//evil.example`.
 */
export const safe_redirect_path = (path: unknown, fallback: string): string => {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return fallback;
  }

  const url = URL.parse(path, BASE);

  if (url?.origin !== BASE || url.pathname.startsWith('//')) {
    return fallback;
  }

  return url.pathname + url.search + url.hash;
};
