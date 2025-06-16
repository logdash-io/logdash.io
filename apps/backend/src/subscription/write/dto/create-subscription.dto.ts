import { UserTier } from '../../../user/core/enum/user-tier.enum';

export interface CreateSubscriptionDto {
  userId: string;
  tier: UserTier;
  startedAt: Date;
  endsAt: Date | null;
}
