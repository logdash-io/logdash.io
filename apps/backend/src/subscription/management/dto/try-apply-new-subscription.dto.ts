import { UserTier } from '../../../user/core/enum/user-tier.enum';

export interface ApplyNewSubscriptionDto {
  userId: string;
  tier: UserTier;
  endsAt: Date | null;
}
