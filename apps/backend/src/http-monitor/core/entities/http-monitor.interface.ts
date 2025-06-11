import { ApiProperty } from '@nestjs/swagger';

export class HttpMonitorNormalized {
  id: string;
  projectId: string;
  name: string;
  url: string;
  notificationChannelsIds: string[];
}

export class HttpMonitorSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  notificationChannelsIds: string[];
}
