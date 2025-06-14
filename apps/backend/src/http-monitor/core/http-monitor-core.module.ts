import { Module } from '@nestjs/common';
import { HttpMonitorLimitModule } from '../limit/http-monitor-limit.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorWriteModule } from '../write/http-monitor-write.module';
import { HttpMonitorCoreController } from './http-monitor-core.controller';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpMonitorStatusModule } from '../status/http-monitor-status.module';
import { HttpPingSchedulerModule } from '../../http-ping/schedule/http-ping-scheduler.module';

@Module({
  imports: [
    HttpMonitorReadModule,
    HttpMonitorWriteModule,
    HttpMonitorLimitModule,
    HttpMonitorStatusModule,
    HttpPingSchedulerModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [HttpMonitorCoreController],
})
export class HttpMonitorCoreModule {}
