const REDACTED = '[redacted]';

/** Matched against the key with `_`, `-` and `.` stripped, lowercased. */
const SECRET_KEY_NAMES = new Set([
  'authorization',
  'cookie',
  'cookies',
  'credential',
  'credentials',
  'jwt',
  'setcookie',
]);

/** Any key ending in one of these is treated as a secret. */
const SECRET_KEY_SUFFIXES = [
  'token',
  'tokens',
  'secret',
  'secrets',
  'password',
  'passphrase',
  'apikey',
  'apikeys',
  'privatekey',
];

// Log payloads here are small dtos. The depth cap keeps a deeply nested or
// cyclic object from turning a log call into a long traversal.
const MAX_DEPTH = 6;

function isSecretKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[_\-.]/g, '');

  return (
    SECRET_KEY_NAMES.has(normalized) ||
    SECRET_KEY_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
  );
}

/**
 * Only object literals are rebuilt. Errors, Dates, Buffers and entity instances
 * are passed through untouched - rebuilding them from their own enumerable keys
 * would drop the very thing that makes them worth logging (an Error, for one,
 * carries message and stack on its prototype).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Defense in depth for accidental secret logging: replaces the value of any key
 * that names a credential. Call sites are still expected not to pass secrets in
 * the first place, this only makes a slip non fatal.
 */
export function redactSecrets<T>(value: T, depth = 0): T {
  if (depth >= MAX_DEPTH) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item, depth + 1)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    redacted[key] = isSecretKey(key) ? REDACTED : redactSecrets(entry, depth + 1);
  }

  return redacted as T;
}
