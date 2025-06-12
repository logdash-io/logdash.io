import { ApiProperty } from '@nestjs/swagger';
import { HttpMonitorStatus } from '../../status/enum/http-monitor-status.enum';

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

  @ApiProperty({ enum: HttpMonitorStatus })
  status: HttpMonitorStatus;
}
