import { Module } from '@nestjs/common';
import { MetricRegisterRedisService } from './metric-register-redis.service';

@Module({
  providers: [MetricRegisterRedisService],
  exports: [MetricRegisterRedisService],
})
export class MetricRegisterRedisModule {}
