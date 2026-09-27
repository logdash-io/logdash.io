import { AccountClaimStatus } from '../../core/enum/account-claim-status.enum';
import { AuthMethod } from '../../core/enum/auth-method.enum';
import { UserOnboarding } from '../../core/entities/user.entity';

export class CreateUserDto {
  email?: string;
  passwordHash?: string;
  authMethod?: AuthMethod;
  accountClaimStatus: AccountClaimStatus;
  avatarUrl?: string;
  marketingConsent?: boolean;
  termsAcceptedAt?: Date;
  onboarding?: UserOnboarding;
}
