import { Module } from '@nestjs/common';
import { LogReadModule } from '../read/log-read.module';
import { LogWriteModule } from '../write/log-write.module';
import { LogCoreController } from './log-core.controller';
import { LogMetricIngestionModule } from '../../log-metric/ingestion/log-metric-ingestion.module';
import { LogQueueingModule } from '../queueing/log-queuing.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { LogEventModule } from '../events/log-event.module';
import { LogTtlModule } from '../ttl/log-ttl.module';
import { LogRateLimitModule } from '../rate-limit/log-rate-limit.module';
import { ApiKeyReadModule } from '../../api-key/read/api-key-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { AddTestLogModule } from '../add-test-log/add-test-log.module';

@Module({
  imports: [
    LogReadModule,
    LogWriteModule,
    LogMetricIngestionModule,
    LogQueueingModule,
    ProjectReadModule,
    LogEventModule,
    ApiKeyReadModule,
    LogTtlModule,
    LogRateLimitModule,
    ClusterReadModule,
    AddTestLogModule,
  ],
  controllers: [LogCoreController],
  providers: [],
})
export class LogCoreModule {}
