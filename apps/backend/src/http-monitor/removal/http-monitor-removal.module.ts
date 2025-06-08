import { Module } from '@nestjs/common';
import { HttpMonitorRemovalService } from './http-monitor-removal.service';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorWriteModule } from '../write/http-monitor-write.module';
import { HttpPingWriteModule } from '../../http-ping/write/http-ping-write.module';

@Module({
  imports: [HttpMonitorReadModule, HttpMonitorWriteModule, HttpPingWriteModule],
  providers: [HttpMonitorRemovalService],
  exports: [HttpMonitorRemovalService],
})
export class HttpMonitorRemovalModule {}
