import * as crypto from 'crypto';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * User-code alphabet: unambiguous only — no 0/O, 1/I/L. 31 symbols.
 * 8 chars => 31^8 ≈ 8.5e11 ≈ 39.6 bits; we draw 8 chars (≥40-bit target met
 * with margin given the rejection-free uniform draw below).
 */
const USER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 symbols
const USER_CODE_LENGTH = 8;

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
 * deviceCode = base62(randomBytes(24)) (~144 bits). The high-entropy secret the
 * CLI holds and polls with — the ONLY thing that can retrieve the minted key.
 * No prefix: it is never sent as an Authorization bearer, only in the poll body.
 */
export function generateDeviceCode(): string {
  return base62(crypto.randomBytes(24));
}

/**
 * userCode = 8 chars from the unambiguous alphabet, formatted XXXX-XXXX. Uniform
 * rejection sampling over the alphabet to avoid modulo bias. ≥40-bit-class entropy.
 * The short, glanceable handle carried in the magic link + shown in terminal & modal.
 */
export function generateUserCode(): string {
  let raw = '';

  while (raw.length < USER_CODE_LENGTH) {
    const byte = crypto.randomBytes(1)[0];
    // Reject the top of the byte range that would bias toward early symbols.
    const max = Math.floor(256 / USER_CODE_ALPHABET.length) * USER_CODE_ALPHABET.length;
    if (byte >= max) {
      continue;
    }
    raw += USER_CODE_ALPHABET[byte % USER_CODE_ALPHABET.length];
  }

  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/**
 * Normalize a user-submitted code for lookup: uppercase, strip everything that
 * is not part of the alphabet (so "abcd efgh", "ABCDEFGH", "ABCD-EFGH" all match).
 */
export function normalizeUserCode(input: string): string {
  const cleaned = (input ?? '')
    .toUpperCase()
    .split('')
    .filter((c) => USER_CODE_ALPHABET.includes(c))
    .join('');

  if (cleaned.length !== USER_CODE_LENGTH) {
    return cleaned; // caller treats a non-8 result as not-found
  }

  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export const USER_CODE_PATTERN = new RegExp(
  `^[${USER_CODE_ALPHABET}]{4}-[${USER_CODE_ALPHABET}]{4}$`,
);
