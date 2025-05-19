import { AccountClaimStatus } from '../../core/enum/account-claim-status.enum';
import { AuthMethod } from '../../core/enum/auth-method.enum';

export class CreateUserDto {
  email?: string;
  passwordHash?: string;
  authMethod?: AuthMethod;
  accountClaimStatus: AccountClaimStatus;
  avatarUrl?: string;
  marketingConsent?: boolean;
}
