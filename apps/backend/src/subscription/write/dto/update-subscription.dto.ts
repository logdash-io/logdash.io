import { UserTier } from '../../../user/core/enum/user-tier.enum';

export interface UpdateSubscriptionDto {
  id: string;
  tier?: UserTier;
  startedAt?: Date;
  endsAt?: Date;
}
