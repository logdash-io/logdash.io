import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HttpMonitorStatus } from '../../status/enum/http-monitor-status.enum';
import { HttpMonitorMode } from '../enums/http-monitor-mode.enum';

export class HttpMonitorNormalized {
  id: string;
  projectId: string;
  name: string;
  url?: string;
  notificationChannelsIds: string[];
  mode: HttpMonitorMode;
}

export class HttpMonitorSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  url?: string;

  @ApiProperty()
  notificationChannelsIds: string[];

  @ApiProperty({ enum: HttpMonitorMode })
  mode: HttpMonitorMode;

  @ApiProperty({ enum: HttpMonitorStatus })
  lastStatus: HttpMonitorStatus;

  @ApiProperty()
  lastStatusCode: number;
}
