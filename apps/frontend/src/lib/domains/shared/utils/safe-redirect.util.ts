/**
 * Only same-origin, non protocol-relative paths are safe to feed into
 * `redirect()`. Anything else (absolute urls, `//evil.example`,
 * `/\evil.example`) turns a redirect into an open redirect.
 */
const SAFE_PATH_PATTERN = /^\/(?![\\/])/;

export const safe_redirect_path = (path: unknown, fallback: string): string =>
  typeof path === 'string' && SAFE_PATH_PATTERN.test(path) ? path : fallback;
