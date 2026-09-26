import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthMethod } from '../enum/auth-method.enum';
import { AccountClaimStatus } from '../enum/account-claim-status.enum';
import { UserTier } from '../enum/user-tier.enum';
import { PaymentsMetadata, UserOnboarding } from './user.entity';

export class PaymentsMetadataSerialized {
  @ApiPropertyOptional()
  trialUsed?: boolean;
}

export class UserNormalized {
  id: string;
  email: string;
  passwordHash?: string;
  authMethod?: AuthMethod;
  accountClaimStatus: AccountClaimStatus;
  tier: UserTier;
  stripeCustomerId?: string;
  avatarUrl?: string;
  paymentsMetadata?: PaymentsMetadata;
  marketingConsent?: boolean;
  termsAcceptedAt?: Date;
  onboarding?: UserOnboarding;
}

export class UserSerialized {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  email: string;

  @ApiPropertyOptional({ enum: AuthMethod })
  authMethod?: AuthMethod;

  @ApiProperty()
  accountClaimStatus: AccountClaimStatus;

  @ApiProperty({ enum: UserTier })
  tier: UserTier;

  @ApiProperty()
  avatarUrl?: string;

  @ApiPropertyOptional({ type: PaymentsMetadataSerialized })
  paymentsMetadata?: PaymentsMetadataSerialized;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  termsAcceptedAt: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  onboardingCompletedAt: string | null;
}
