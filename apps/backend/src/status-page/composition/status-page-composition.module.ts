import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { HttpPingBucketAggregationModule } from '../../http-ping-bucket/aggregation/http-ping-bucket-aggregation.module';
import { HttpPingAggregationModule } from '../../http-ping/aggregation/http-ping-aggregation.module';
import { HttpPingReadModule } from '../../http-ping/read/http-ping-read.module';
import { PublicDashboardReadModule } from '../../public-dashboard/read/public-dashboard-read.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { StatusPageCompositionService } from './status-page-composition.service';

@Module({
  imports: [
    PublicDashboardReadModule,
    HttpMonitorReadModule,
    HttpPingReadModule,
    HttpPingAggregationModule,
    HttpPingBucketAggregationModule,
    RedisModule,
  ],
  providers: [StatusPageCompositionService],
  exports: [StatusPageCompositionService],
})
export class StatusPageCompositionModule {}
