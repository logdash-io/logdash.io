import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from 'src/http-monitor/read/http-monitor-read.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpPingBucketWriteModule } from '../../http-ping-bucket/write/http-ping-bucket-write.module';
import { HttpPingBucketAggregationModule } from '../aggregation/http-ping-bucket-aggregation.module';
import { HttpPingBucketIngestionModule } from '../ingestion/http-ping-bucket-ingestion.module';
import { HttpPingBucketTtlModule } from '../ttl/http-ping-bucket-ttl.module';
import { HttpPingBucketCoreController } from './http-ping-bucket-core.controller';

@Module({
  imports: [
    HttpModule,
    HttpMonitorReadModule,
    HttpPingBucketIngestionModule,
    HttpPingBucketWriteModule,
    HttpPingBucketTtlModule,
    HttpPingBucketAggregationModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [HttpPingBucketCoreController],
})
export class HttpPingBucketCoreModule {}
