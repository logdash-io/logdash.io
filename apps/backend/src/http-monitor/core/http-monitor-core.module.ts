import { Module } from '@nestjs/common';
import { HttpMonitorLimitModule } from '../limit/http-monitor-limit.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorWriteModule } from '../write/http-monitor-write.module';
import { HttpMonitorCoreController } from './http-monitor-core.controller';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpMonitorStatusModule } from '../status/http-monitor-status.module';
import { HttpPingPingerModule } from '../../http-ping/pinger/http-ping-pinger.module';
import { HttpPingPushModule } from '../../http-ping/push/http-ping-push.module';
import { HttpMonitorRemovalModule } from '../removal/http-monitor-removal.module';
import { HttpMonitorTtlModule } from '../ttl/http-monitor-ttl.module';

@Module({
  imports: [
    HttpMonitorReadModule,
    HttpMonitorWriteModule,
    HttpMonitorLimitModule,
    HttpMonitorStatusModule,
    HttpPingPingerModule,
    HttpPingPushModule,
    HttpMonitorRemovalModule,
    HttpMonitorTtlModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [HttpMonitorCoreController],
})
export class HttpMonitorCoreModule {}
