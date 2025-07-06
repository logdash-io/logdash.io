import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { purchasableTiers, UserTier } from '../../../user/core/enum/user-tier.enum';

export class CheckoutQuery {
  @ApiProperty()
  @IsIn(purchasableTiers)
  tier: UserTier;
}
