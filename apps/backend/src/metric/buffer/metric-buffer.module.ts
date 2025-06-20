import { Module } from '@nestjs/common';
import { MetricBufferService } from './metric-buffer.service';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { MetricRegisterWriteModule } from '../../metric-register/write/metric-register-write.module';
import { MetricBufferDataService } from './metric-buffer.data.service';

@Module({
  imports: [MetricRegisterReadModule, MetricRegisterWriteModule],
  providers: [MetricBufferService, MetricBufferDataService],
  exports: [MetricBufferService],
})
export class MetricBufferModule {}
