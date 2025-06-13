import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { BucketGranularity } from './bucket-granularity.enum';
import { VirtualBucket } from './virtual-bucket.type';

@ApiExtraModels(VirtualBucket)
export class BucketsResponse {
  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(VirtualBucket) }, { type: 'null' }],
    isArray: true,
  })
  buckets: (VirtualBucket | null)[];

  @ApiProperty({ enum: BucketGranularity })
  granularity: BucketGranularity;
}
