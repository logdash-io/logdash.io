import type { UserTier } from '$lib/domains/shared/types';

export type User = {
  id: string;
  tier: UserTier;
  avatarUrl?: string;
  email?: string;
  authMethod?: string;
};
