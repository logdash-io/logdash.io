import { Module } from '@nestjs/common';
import { NewMetricQueueingService } from './new-metric-queueing.service';
import { MetricRegisterRedisModule } from '../../metric-register/redis/metric-register-redis.module';
import { MetricRegisterWriteModule } from '../../metric-register/write/metric-register-write.module';
import { MetricBufferModule } from '../buffer/metric-buffer.module';
import { ProjectReadModule } from '../../project/read/project-read.module';

@Module({
  imports: [
    MetricRegisterRedisModule,
    MetricRegisterWriteModule,
    MetricBufferModule,
    ProjectReadModule,
  ],
  providers: [NewMetricQueueingService],
  exports: [NewMetricQueueingService],
})
export class NewMetricQueueingModule {}
