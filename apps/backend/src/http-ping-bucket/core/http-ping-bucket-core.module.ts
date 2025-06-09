import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from 'src/http-monitor/read/http-monitor-read.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpPingBucketSchedulerModule } from '../../http-ping-bucket/schedule/http-ping-bucket-scheduler.module';
import { HttpPingBucketWriteModule } from '../../http-ping-bucket/write/http-ping-bucket-write.module';
import { HttpPingBucketAggregateModule } from '../aggregate/http-ping-bucket-aggregate.module';
import { HttpPingBucketTtlModule } from '../ttl/http-ping-bucket-ttl.module';
import { HttpPingBucketCoreController } from './http-ping-bucket-core.controller';

@Module({
  imports: [
    HttpModule,
    HttpMonitorReadModule,
    HttpPingBucketSchedulerModule,
    HttpPingBucketWriteModule,
    HttpPingBucketTtlModule,
    HttpPingBucketAggregateModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [HttpPingBucketCoreController],
})
export class HttpPingBucketCoreModule {}
