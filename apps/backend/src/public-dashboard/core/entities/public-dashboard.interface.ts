import { ApiProperty } from '@nestjs/swagger';

export class PublicDashboardNormalized {
  id: string;
  clusterId: string;
  httpMonitorsIds: string[];
}

export class PublicDashboardSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty({ type: [String] })
  httpMonitorsIds: string[];
}
