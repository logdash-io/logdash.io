import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { HttpPingSerialized } from '../../../http-ping/core/entities/http-ping.interface';
import { VirtualBucket } from '../../../http-ping-bucket/core/types/virtual-bucket.type';

@ApiExtraModels(VirtualBucket)
export class PublicDashboardMonitorDto {
  @ApiProperty()
  name: string;

  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(VirtualBucket) }, { type: 'null' }],
    isArray: true,
  })
  buckets: (VirtualBucket | null)[];

  @ApiProperty({
    type: HttpPingSerialized,
    isArray: true,
  })
  pings: HttpPingSerialized[];
}

export class PublicDashboardDataResponse {
  @ApiProperty({
    type: PublicDashboardMonitorDto,
    isArray: true,
  })
  httpMonitors: PublicDashboardMonitorDto[];
}
