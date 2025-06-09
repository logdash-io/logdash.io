import { Module } from '@nestjs/common';
import { LogMetricWriteModule } from '../write/log-metric-write.module';
import { LogMetricReadModule } from '../read/log-metric-read.module';
import { LogMetricCoreController } from './log-metric-core.controller';
import { LogMetricTtlModule } from '../ttl/log-metric-ttl.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Module({
  imports: [
    LogMetricWriteModule,
    LogMetricReadModule,
    LogMetricTtlModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [LogMetricCoreController],
  providers: [],
})
export class LogMetricCoreModule {}
