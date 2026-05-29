import { AccessRestriction } from '../../personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../personal-api-key/core/types/scope-entry.type';

export type CliAuthStatus = 'pending' | 'approved' | 'denied';

/**
 * The pending-authorization record. Lives in Redis only (TTL 600s). Indexed by
 * BOTH hmac(deviceCode) (poll lookup — the secret path) and userCode (approve
 * lookup — the glanceable path). The plaintext `keyValue` is present only between
 * approval and the first poll, then the whole record is deleted (one-time delivery).
 */
export interface CliAuthPendingRecord {
  status: CliAuthStatus;
  userId: string | null;
  keyValue: string | null; // plaintext personal API key, delivered exactly once then deleted
  userCode: string;
  deviceCodeHash: string; // hmac(deviceCode) — lets approve/deny resolve the device index
  createdAt: number; // epoch ms
}

export const CLI_AUTH_TTL_SECONDS = 600; // 10 minutes
export const CLI_AUTH_POLL_INTERVAL_SECONDS = 5;

export interface CliAuthApproveInput {
  userId: string;
  userCode: string;
  scopes?: ScopeEntry[];
  access?: AccessRestriction;
}
