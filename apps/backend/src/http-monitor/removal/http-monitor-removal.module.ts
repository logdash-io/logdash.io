import { Module } from '@nestjs/common';
import { HttpMonitorRemovalService } from './http-monitor-removal.service';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorWriteModule } from '../write/http-monitor-write.module';
import { HttpPingWriteModule } from '../../http-ping/write/http-ping-write.module';
import { PublicDashboardMonitorsModule } from '../../public-dashboard/monitors/public-dashboard-monitors.module';
import { HttpPingBucketWriteModule } from '../../http-ping-bucket/write/http-ping-bucket-write.module';

@Module({
  imports: [
    HttpMonitorReadModule,
    HttpMonitorWriteModule,
    HttpPingWriteModule,
    HttpPingBucketWriteModule,
    PublicDashboardMonitorsModule,
  ],
  providers: [HttpMonitorRemovalService],
  exports: [HttpMonitorRemovalService],
})
export class HttpMonitorRemovalModule {}
