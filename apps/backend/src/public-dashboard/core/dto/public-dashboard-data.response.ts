import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { HttpPingSerialized } from '../../../http-ping/core/entities/http-ping.interface';
import { VirtualBucket } from '../../../http-ping-bucket/core/types/virtual-bucket.type';

export class PublicDashboardDataResponse {
  @ApiProperty()
  httpMonitors: PublicDashboardMonitorDto[];
}

@ApiExtraModels(VirtualBucket)
export class PublicDashboardMonitorDto {
  @ApiProperty()
  name: string;

  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(VirtualBucket) }, { type: 'null' }],
    isArray: true,
  })
  buckets: (VirtualBucket | null)[];

  @ApiProperty()
  pings: HttpPingSerialized[];
}
