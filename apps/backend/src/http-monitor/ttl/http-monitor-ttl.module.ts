import { Module } from '@nestjs/common';
import { HttpMonitorTtlService } from './http-monitor-ttl.service';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorRemovalModule } from '../removal/http-monitor-removal.module';

@Module({
  imports: [HttpMonitorReadModule, HttpMonitorRemovalModule],
  providers: [HttpMonitorTtlService],
  exports: [HttpMonitorTtlService],
})
export class HttpMonitorTtlModule {}
