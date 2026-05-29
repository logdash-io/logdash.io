import * as crypto from 'crypto';
import { getEnvConfig } from '../../shared/configs/env-configs';

/**
 * HMAC-SHA256 the presented value with the server-side secret (ADR-0001). The
 * secret acts as a pepper: a DB-only leak yields digests that cannot be verified
 * offline. No per-row salt, no argon2.
 */
export function hashPersonalApiKeyValue(value: string): string {
  const secret = getEnvConfig().personalApiKey.hmacSecret;

  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

/**
 * Constant-time comparison of a presented value's HMAC against a stored digest.
 */
export function verifyPersonalApiKeyValue(value: string, storedHash: string): boolean {
  const computed = hashPersonalApiKeyValue(value);

  const computedBuffer = Buffer.from(computed, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');

  if (computedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, storedBuffer);
}
