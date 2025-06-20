import { Module } from '@nestjs/common';
import { MetricRegisterRedisService } from './metric-register-redis.service';
import { MetricRegisterReadModule } from '../read/metric-register-read.module';

@Module({
  imports: [MetricRegisterReadModule],
  providers: [MetricRegisterRedisService],
  exports: [MetricRegisterRedisService],
})
export class MetricRegisterRedisModule {}
