import { AccessRestriction } from '../../personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../personal-api-key/core/types/scope-entry.type';

export type CliAuthStatus = 'pending' | 'approved' | 'denied';

/**
 * The pending-authorization record. Lives in Redis only (TTL 600s). Indexed by
 * BOTH hmac(deviceCode) (poll lookup — the secret path) and userCode (approve
 * lookup — the glanceable path). The plaintext `keyValue` is present only between
 * approval and the first poll, then the whole record is deleted (one-time delivery).
 *
 * `clientIp` / `clientUserAgent` bind the record to the machine that called
 * `/start`; they are surfaced on the consent screen so the human can tell "my
 * laptop" from "someone else's box" before approving.
 */
export interface CliAuthPendingRecord {
  status: CliAuthStatus;
  userId: string | null;
  keyValue: string | null; // plaintext personal API key, delivered exactly once then deleted
  userCode: string;
  deviceCodeHash: string; // hmac(deviceCode) — lets approve/deny resolve the device index
  createdAt: number; // epoch ms
  clientIp: string; // socket peer address of the /start caller (never a client-supplied header)
  clientUserAgent: string; // self-reported by the /start caller — advisory only
}

export const CLI_AUTH_TTL_SECONDS = 600; // 10 minutes
export const CLI_AUTH_POLL_INTERVAL_SECONDS = 5;

/**
 * CLI-minted keys always expire. There is no "until revoked" option here: an
 * unattended credential handed to a terminal must age out on its own.
 */
export const CLI_AUTH_KEY_TTL_DAYS = 30;

/**
 * Brute-force budget for userCode lookups (lookup/approve/deny), counted per
 * session user over a rolling window. The userCode is only ~40 bits and lives for
 * 10 minutes, so unmetered guessing is the one way to reach someone else's pending
 * record — ADR-0003 invariant #2.
 */
export const CLI_AUTH_LOOKUP_MAX_ATTEMPTS = 20;
export const CLI_AUTH_LOOKUP_WINDOW_SECONDS = 600;

export interface CliAuthStartInput {
  clientIp: string;
  clientUserAgent: string;
}

/** What the consent screen shows the user about the machine that asked. */
export interface CliAuthRequestDetails {
  userCode: string;
  clientIp: string;
  clientUserAgent: string;
  requestedAt: string;
  expiresAt: string;
}

export interface CliAuthApproveInput {
  userId: string;
  userCode: string;
  access: AccessRestriction; // explicit — never defaulted to { kind: 'all' }
  scopes?: ScopeEntry[];
}
