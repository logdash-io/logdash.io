import { Module } from '@nestjs/common';
import { MetricWriteModule } from '../write/metric-write.module';
import { MetricIngestionService } from './metric-ingestion.service';
import { MetricReadModule } from '../read/metric-read.module';
import { MetricRegisterQualificationModule } from '../../metric-register/qualification/metric-register-qualification.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { MetricEventModule } from '../events/metric-event.module';
import { MetricRegisterWriteModule } from '../../metric-register/write/metric-register-write.module';

@Module({
  imports: [
    MetricWriteModule,
    MetricReadModule,
    MetricRegisterQualificationModule,
    MetricRegisterReadModule,
    MetricEventModule,
    MetricRegisterWriteModule,
  ],
  providers: [MetricIngestionService],
  exports: [MetricIngestionService],
})
export class MetricIngestionModule {}
