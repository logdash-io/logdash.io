import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ExtendActiveSubscriptionBody {
  @ApiProperty()
  @IsDateString()
  endsAt: string;
}
