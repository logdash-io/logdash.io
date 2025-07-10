import { Module } from '@nestjs/common';
import { MetricReadModule } from '../read/metric-read.module';
import { MetricCoreController } from './metric-core.controller';
import { MetricQueueingModule } from '../queueing/metric-queueing-module';
import { ApiKeyReadModule } from '../../api-key/read/api-key-read.module';
import { MetricTtlModule } from '../ttl/metric-ttl.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { MetricEventModule } from '../events/metric-event.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { NewMetricQueueingModule } from '../new-queueing/new-metric-queueing.module';
import { MetricRecordModule } from '../record/metric-record.module';

@Module({
  imports: [
    MetricReadModule,
    MetricQueueingModule,
    ApiKeyReadModule,
    ApiKeyReadModule,
    MetricTtlModule,
    MetricRegisterReadModule,
    MetricEventModule,
    NewMetricQueueingModule,
    MetricRecordModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [MetricCoreController],
})
export class MetricCoreModule {}
