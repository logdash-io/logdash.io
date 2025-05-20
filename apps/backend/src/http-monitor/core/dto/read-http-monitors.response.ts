import { ApiProperty } from '@nestjs/swagger';
import { HttpMonitorSerialized } from '../entities/http-monitor.interface';

export class ReadHttpMonitorsResponse {
  @ApiProperty({ type: HttpMonitorSerialized, isArray: true })
  monitors: HttpMonitorSerialized[];
}
