import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserTier } from '../../../user/core/enum/user-tier.enum';

export class SubscriptionNormalized {
  id: string;
  userId: string;
  tier: UserTier;
  startedAt: Date;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: UserTier })
  tier: UserTier;

  @ApiProperty()
  startedAt: string;

  @ApiProperty()
  endsAt: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
