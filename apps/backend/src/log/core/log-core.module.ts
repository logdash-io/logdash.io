import { Module } from '@nestjs/common';
import { LogReadModule } from '../read/log-read.module';
import { LogWriteModule } from '../write/log-write.module';
import { LogCoreController } from './log-core.controller';
import { LogQueueingModule } from '../queueing/log-queuing.module';
import { LogEventModule } from '../events/log-event.module';
import { LogTtlModule } from '../ttl/log-ttl.module';
import { LogRateLimitModule } from '../rate-limit/log-rate-limit.module';
import { IngestProjectModule } from '../../project/ingest/ingest-project.module';
import { AddTestLogModule } from '../add-test-log/add-test-log.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { LogAnalyticsModule } from '../analytics/log-analytics.module';

@Module({
  imports: [
    LogReadModule,
    LogWriteModule,
    LogQueueingModule,
    LogEventModule,
    IngestProjectModule,
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
