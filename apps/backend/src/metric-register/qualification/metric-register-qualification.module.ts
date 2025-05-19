import { Module } from '@nestjs/common';
import { MetricRegisterQualificationService } from './metric-register-qualification.service';
import { MetricRegisterReadModule } from '../read/metric-register-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { MetricRegisterWriteModule } from '../write/metric-register-write.module';

@Module({
  imports: [
    MetricRegisterReadModule,
    ProjectReadModule,
    MetricRegisterWriteModule,
  ],
  providers: [MetricRegisterQualificationService],
  exports: [MetricRegisterQualificationService],
})
export class MetricRegisterQualificationModule {}
