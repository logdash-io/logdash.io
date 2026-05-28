import * as crypto from 'crypto';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const PERSONAL_API_KEY_PREFIX = 'ldp_';
export const PERSONAL_API_KEY_PREFIX_LENGTH = 12; // "ldp_" + first 8 chars

function base62(bytes: Buffer): string {
  let num = BigInt('0x' + bytes.toString('hex'));
  const base = BigInt(BASE62.length);

  if (num === 0n) {
    return BASE62[0];
  }

  let result = '';
  while (num > 0n) {
    const remainder = num % base;
    result = BASE62[Number(remainder)] + result;
    num = num / base;
  }

  return result;
}

/**
 * value = "ldp_" + base62(randomBytes(24)) (~144 bits entropy).
 * prefix = first 12 chars ("ldp_" + 8). Returned once; plaintext never stored.
 */
export function generatePersonalApiKeyValue(): { value: string; prefix: string } {
  const value = PERSONAL_API_KEY_PREFIX + base62(crypto.randomBytes(24));
  const prefix = value.slice(0, PERSONAL_API_KEY_PREFIX_LENGTH);

  return { value, prefix };
}

export function extractPrefix(value: string): string {
  return value.slice(0, PERSONAL_API_KEY_PREFIX_LENGTH);
}
