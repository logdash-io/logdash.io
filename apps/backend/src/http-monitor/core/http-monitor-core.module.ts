import { Module } from '@nestjs/common';
import { HttpMonitorLimitModule } from '../limit/http-monitor-limit.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorWriteModule } from '../write/http-monitor-write.module';
import { HttpMonitorCoreController } from './http-monitor-core.controller';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpMonitorStatusChangeModule } from '../status-change/http-monitor-status-change.module';

@Module({
  imports: [
    HttpMonitorReadModule,
    HttpMonitorWriteModule,
    HttpMonitorLimitModule,
    HttpMonitorStatusChangeModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [HttpMonitorCoreController],
})
export class HttpMonitorCoreModule {}
