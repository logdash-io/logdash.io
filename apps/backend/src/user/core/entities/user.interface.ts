import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthMethod } from '../enum/auth-method.enum';
import { AccountClaimStatus } from '../enum/account-claim-status.enum';
import { UserTier } from '../enum/user-tier.enum';
import { PaymentsMetadata } from './user.entity';

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
}
