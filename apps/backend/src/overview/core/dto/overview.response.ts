import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HttpMonitorStatus } from '../../../http-monitor/status/enum/http-monitor-status.enum';

export class ProjectErrorCount {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty({
    description: 'Count of error/fatal-level logs for this project over the window.',
  })
  errorCount: number;
}

export class MonitorStatusEntry {
  @ApiProperty()
  monitorId: string;

  @ApiProperty()
  monitorName: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty({ enum: HttpMonitorStatus })
  status: HttpMonitorStatus;
}

export class ProjectDataFlow {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the most recent log was received, or null if none ever.',
  })
  lastLogReceivedAt: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When a metric was last reported, or null if none ever.',
  })
  lastMetricReceivedAt: string | null;
}

export class OverviewResponse {
  @ApiProperty({
    description: 'Window start (inclusive) the verdict was computed over.',
    type: String,
    format: 'date-time',
  })
  since: string;

  @ApiProperty({
    type: ProjectErrorCount,
    isArray: true,
    description: 'Per-project error/fatal log count over the window, worst (highest count) first.',
  })
  errors: ProjectErrorCount[];

  @ApiProperty({
    type: MonitorStatusEntry,
    isArray: true,
    description: 'Per-monitor up/down/unknown status, currently-down monitors first.',
  })
  monitors: MonitorStatusEntry[];

  @ApiProperty({
    description: 'Number of monitors currently reporting down.',
  })
  monitorsDown: number;

  @ApiProperty({
    type: ProjectDataFlow,
    isArray: true,
    description: 'Per-project last-log-received and last-metric-received timestamps.',
  })
  dataFlow: ProjectDataFlow[];
}
