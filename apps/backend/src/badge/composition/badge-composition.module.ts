import { Module } from '@nestjs/common';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { CustomDomainReadModule } from '../../custom-domain/read/custom-domain-read.module';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { HttpPingBucketAggregationModule } from '../../http-ping-bucket/aggregation/http-ping-bucket-aggregation.module';
import { HttpPingReadModule } from '../../http-ping/read/http-ping-read.module';
import { PublicDashboardReadModule } from '../../public-dashboard/read/public-dashboard-read.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { BadgeCompositionService } from './badge-composition.service';

@Module({
  imports: [
    PublicDashboardReadModule,
    CustomDomainReadModule,
    HttpMonitorReadModule,
    ClusterReadModule,
    HttpPingReadModule,
    HttpPingBucketAggregationModule,
    RedisModule,
  ],
  providers: [BadgeCompositionService],
  exports: [BadgeCompositionService],
})
export class BadgeCompositionModule {}
