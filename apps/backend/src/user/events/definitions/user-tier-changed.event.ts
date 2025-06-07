import { UserTier } from '../../core/enum/user-tier.enum';

export interface UserTierChangedEvent {
  userId: string;
  newTier: UserTier;
}
