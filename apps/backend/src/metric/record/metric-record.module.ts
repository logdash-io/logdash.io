import { Module } from '@nestjs/common';
import { MetricRecordService } from './metric-record.service';
import { MetricWriteModule } from '../write/metric-write.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';

@Module({
  imports: [MetricWriteModule, MetricRegisterReadModule],
  providers: [MetricRecordService],
  exports: [MetricRecordService],
})
export class MetricRecordModule {}
