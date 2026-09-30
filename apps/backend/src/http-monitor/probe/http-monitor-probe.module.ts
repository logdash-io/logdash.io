import { Module } from '@nestjs/common';
import { HttpMonitorProbeService } from './http-monitor-probe.service';

@Module({
  providers: [HttpMonitorProbeService],
  exports: [HttpMonitorProbeService],
})
export class HttpMonitorProbeModule {}
