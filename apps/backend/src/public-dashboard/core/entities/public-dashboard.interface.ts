import { ApiProperty } from '@nestjs/swagger';

export class PublicDashboardNormalized {
  id: string;
  clusterId: string;
  httpMonitorsIds: string[];
  name: string;
  isPublic: boolean;
}

export class PublicDashboardSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty({ type: [String] })
  httpMonitorsIds: string[];

  @ApiProperty()
  name: string;

  @ApiProperty()
  isPublic: boolean;
}
