import { ApiProperty } from '@nestjs/swagger';
import { MonitorStatus } from '../../../http-ping/core/enums/monitor-status.enum';
import { StatusPageStatus } from '../enums/status-page-status.enum';

export class StatusPageBucketDto {
  @ApiProperty({ type: String, format: 'date-time', description: 'Start of the UTC day' })
  timestamp: string;

  @ApiProperty({ type: 'integer' })
  successCount: number;

  @ApiProperty({ type: 'integer' })
  failureCount: number;

  @ApiProperty({ type: Number, nullable: true, description: 'Null when the day has no checks' })
  averageLatencyMs: number | null;
}

export class StatusPagePingDto {
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: 'integer', description: '0 when the request got no response' })
  statusCode: number;

  @ApiProperty({ type: Number })
  responseTimeMs: number;
}

export class StatusPageUptimeDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Percent, null without checks' })
  '1h': number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Percent, null without checks' })
  '24h': number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Percent, null without checks' })
  '7d': number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Percent, null without checks' })
  '30d': number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Percent, null without checks' })
  '90d': number | null;
}

export class StatusPageHistoryDto {
  @ApiProperty({
    type: () => [StatusPageBucketDto],
    description: '90 UTC days, oldest first, today last. Days without checks have zero counts.',
  })
  daily: StatusPageBucketDto[];
}

export class StatusPageMonitorDto {
  @ApiProperty({ type: String, description: 'Stable public key of the monitor' })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ enum: MonitorStatus, enumName: 'StatusPageMonitorStatus' })
  status: MonitorStatus;

  @ApiProperty({ type: () => StatusPageUptimeDto })
  uptime: StatusPageUptimeDto;

  @ApiProperty({ type: () => StatusPageHistoryDto })
  history: StatusPageHistoryDto;

  @ApiProperty({ type: () => [StatusPagePingDto], description: 'Last 100 checks, oldest first' })
  pings: StatusPagePingDto[];
}

export class StatusPageDto {
  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ enum: StatusPageStatus, enumName: 'StatusPageStatus' })
  status: StatusPageStatus;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'When the server composed this response',
  })
  updatedAt: string;

  @ApiProperty({
    type: () => [StatusPageMonitorDto],
    description: 'In the order configured on the status page',
  })
  monitors: StatusPageMonitorDto[];
}
