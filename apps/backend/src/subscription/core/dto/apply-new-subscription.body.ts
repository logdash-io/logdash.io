import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn } from 'class-validator';
import { UserTier } from '../../../user/core/enum/user-tier.enum';

export class ApplyNewSubscriptionBody {
  @ApiProperty()
  @IsIn([UserTier.Contributor])
  tier: UserTier;

  @ApiProperty()
  @IsDateString()
  endsAt: string;
}
