import * as crypto from 'crypto';
import { getEnvConfig } from '../../shared/configs/env-configs';

/**
 * HMAC-SHA256 the deviceCode with the server-side secret (same pepper pattern as
 * Personal API Keys, ADR-0001). The raw deviceCode is NEVER stored — only this
 * digest is used as the Redis lookup key, so a Redis-only leak cannot be used to
 * forge a poll: the attacker would need the raw deviceCode, which never lands there.
 */
export function hashDeviceCode(deviceCode: string): string {
  const secret = getEnvConfig().personalApiKey.hmacSecret;

  return crypto.createHmac('sha256', secret).update(deviceCode).digest('hex');
}
