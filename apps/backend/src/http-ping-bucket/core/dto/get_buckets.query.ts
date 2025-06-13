import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BucketsPeriod } from 'src/http-ping-bucket/core/types/bucket-period.enum';

export class GetBucketsQuery {
  @ApiProperty({ enum: BucketsPeriod })
  @IsEnum(BucketsPeriod)
  period: BucketsPeriod;
}
