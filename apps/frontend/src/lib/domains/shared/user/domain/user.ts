import type { UserTier } from '$lib/domains/shared/types';

export type AccountClaimStatus = 'anonymous' | 'claimed';

export type User = {
  id: string;
  tier: UserTier;
  avatarUrl?: string;
  email?: string;
  authMethod?: string;
  accountClaimStatus?: AccountClaimStatus;
};
