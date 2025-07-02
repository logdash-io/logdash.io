import { Module } from '@nestjs/common';
import { LogReadModule } from '../read/log-read.module';
import { LogWriteModule } from '../write/log-write.module';
import { LogCoreController } from './log-core.controller';
import { LogMetricIngestionModule } from '../../log-metric/ingestion/log-metric-ingestion.module';
import { LogQueueingModule } from '../queueing/log-queuing.module';
import { LogEventModule } from '../events/log-event.module';
import { LogTtlModule } from '../ttl/log-ttl.module';
import { LogRateLimitModule } from '../rate-limit/log-rate-limit.module';
import { ApiKeyReadModule } from '../../api-key/read/api-key-read.module';
import { AddTestLogModule } from '../add-test-log/add-test-log.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { LogAnalyticsModule } from '../analytics/log-analytics.module';

@Module({
  imports: [
    LogReadModule,
    LogWriteModule,
    LogMetricIngestionModule,
    LogQueueingModule,
    LogEventModule,
    ApiKeyReadModule,
    LogTtlModule,
    LogRateLimitModule,
    AddTestLogModule,
    LogAnalyticsModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [LogCoreController],
  providers: [],
})
export class LogCoreModule {}
