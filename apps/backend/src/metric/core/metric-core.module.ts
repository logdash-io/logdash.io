import { Module } from '@nestjs/common';
import { MetricReadModule } from '../read/metric-read.module';
import { MetricCoreController } from './metric-core.controller';
import { MetricQueueingModule } from '../queueing/metric-queueing-module';
import { ApiKeyReadModule } from '../../api-key/read/api-key-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { MetricTtlModule } from '../ttl/metric-ttl.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { MetricEventModule } from '../events/metric-event.module';

@Module({
  imports: [
    MetricReadModule,
    MetricQueueingModule,
    ApiKeyReadModule,
    ProjectReadModule,
    ApiKeyReadModule,
    MetricTtlModule,
    MetricRegisterReadModule,
    ClusterReadModule,
    MetricEventModule,
  ],
  controllers: [MetricCoreController],
})
export class MetricCoreModule {}
