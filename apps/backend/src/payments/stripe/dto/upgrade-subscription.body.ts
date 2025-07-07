import { IsIn } from 'class-validator';
import { paidTiers, UserTier } from '../../../user/core/enum/user-tier.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePaidPlanBody {
  @ApiProperty()
  @IsIn(paidTiers)
  tier: UserTier;
}
