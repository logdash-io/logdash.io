import * as crypto from 'crypto';

/**
 * Constant-time comparison of two secrets. Returns false when either side is
 * missing or empty so that an unset server-side secret can never match.
 */
export function secureCompare(presented: unknown, expected: string | undefined): boolean {
  if (typeof presented !== 'string' || !presented || !expected) {
    return false;
  }

  const presentedBuffer = Buffer.from(presented, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (presentedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(presentedBuffer, expectedBuffer);
}
