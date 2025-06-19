import { Module } from '@nestjs/common';
import { MetricBufferService } from './metric-buffer.service';

@Module({
  providers: [MetricBufferService],
  exports: [MetricBufferService],
})
export class MetricBufferModule {}
