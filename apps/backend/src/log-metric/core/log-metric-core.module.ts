import { Module } from '@nestjs/common';
import { LogMetricWriteModule } from '../write/log-metric-write.module';
import { LogMetricReadModule } from '../read/log-metric-read.module';
import { LogMetricCoreController } from './log-metric-core.controller';
import { LogMetricTtlModule } from '../ttl/log-metric-ttl.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';

@Module({
  imports: [
    LogMetricWriteModule,
    LogMetricReadModule,
    LogMetricTtlModule,
    ProjectReadModule,
    ClusterReadModule,
  ],
  controllers: [LogMetricCoreController],
  providers: [],
})
export class LogMetricCoreModule {}
