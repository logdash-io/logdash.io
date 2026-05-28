import { Module } from '@nestjs/common';
import { OverviewCoreController } from './overview-core.controller';
import { OverviewReadService } from '../read/overview-read.service';
import { LogReadModule } from '../../log/read/log-read.module';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { HttpMonitorStatusModule } from '../../http-monitor/status/http-monitor-status.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Module({
  imports: [
    LogReadModule,
    HttpMonitorReadModule,
    HttpMonitorStatusModule,
    MetricRegisterReadModule,
    ProjectReadModule,
    ClusterReadModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [OverviewCoreController],
  providers: [OverviewReadService],
})
export class OverviewCoreModule {}
