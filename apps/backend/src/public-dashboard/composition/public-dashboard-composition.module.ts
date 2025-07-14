import { Module } from '@nestjs/common';
import { PublicDashboardCompositionService } from './public-dashboard-composition.service';
import { RedisModule } from '../../shared/redis/redis.module';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { HttpPingReadModule } from '../../http-ping/read/http-ping-read.module';
import { PublicDashboardReadModule } from '../read/public-dashboard-read.module';
import { HttpPingBucketAggregationModule } from '../../http-ping-bucket/aggregation/http-ping-bucket-aggregation.module';
import { CustomDomainReadModule } from '../../custom-domain/read/custom-domain-read.module';

@Module({
  imports: [
    HttpPingReadModule,
    PublicDashboardReadModule,
    HttpMonitorReadModule,
    HttpPingBucketAggregationModule,
    RedisModule,
    CustomDomainReadModule,
  ],
  providers: [PublicDashboardCompositionService],
  exports: [PublicDashboardCompositionService],
})
export class PublicDashboardCompositionModule {}
