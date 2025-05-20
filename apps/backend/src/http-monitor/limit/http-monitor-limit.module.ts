import { Module } from '@nestjs/common';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorLimitService } from './http-monitor-limit.service';

@Module({
  imports: [UserReadModule, HttpMonitorReadModule, ClusterReadModule],
  providers: [HttpMonitorLimitService],
  exports: [HttpMonitorLimitService],
})
export class HttpMonitorLimitModule {}
