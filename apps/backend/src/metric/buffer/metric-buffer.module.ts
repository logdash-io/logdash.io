import { Module } from '@nestjs/common';
import { MetricBufferService } from './metric-buffer.service';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { MetricRegisterWriteModule } from '../../metric-register/write/metric-register-write.module';

@Module({
  imports: [MetricRegisterReadModule, MetricRegisterWriteModule],
  providers: [MetricBufferService],
  exports: [MetricBufferService],
})
export class MetricBufferModule {}
