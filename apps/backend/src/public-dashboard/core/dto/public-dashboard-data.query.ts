import { ApiProperty } from '@nestjs/swagger';
import { BucketsPeriod } from '../../../http-ping-bucket/core/types/bucket-period.enum';
import { IsEnum } from 'class-validator';

export class PublicDashboardDataQuery {
  @ApiProperty({
    enum: BucketsPeriod,
  })
  @IsEnum(BucketsPeriod)
  period: BucketsPeriod;
}
