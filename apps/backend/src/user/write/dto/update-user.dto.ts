import { AccountClaimStatus } from '../../core/enum/account-claim-status.enum';
import { AuthMethod } from '../../core/enum/auth-method.enum';
import { UserTier } from '../../core/enum/user-tier.enum';
import { UserOnboarding } from '../../core/entities/user.entity';

export class UpdateUserDto {
  id: string;
  authMethod?: AuthMethod;
  accountClaimStatus?: AccountClaimStatus;
  email?: string;
  tier?: UserTier;
  stripeCustomerId?: string;
  avatarUrl?: string;
  marketingConsent?: boolean;
  termsAcceptedAt?: Date;
  onboarding?: UserOnboarding;
}
