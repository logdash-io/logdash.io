import { UserTier } from '../../../user/core/enum/user-tier.enum';

export interface TryApplyNewSubscriptionDto {
  userId: string;
  tier: UserTier;
  endsAt: Date;
}
