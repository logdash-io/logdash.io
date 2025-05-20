import { Module } from '@nestjs/common';
import { ProjectWriteModule } from '../write/project-write.module';
import { LogWriteModule } from '../../log/write/log-write.module';
import { LogMetricWriteModule } from '../../log-metric/write/log-metric-write.module';
import { MetricWriteModule } from '../../metric/write/metric-write.module';
import { MetricRegisterWriteModule } from '../../metric-register/write/metric-register-write.module';
import { ProjectRemovalService } from './project-removal.service';
import { ProjectReadModule } from '../read/project-read.module';

@Module({
  imports: [
    ProjectReadModule,
    ProjectWriteModule,
    LogWriteModule,
    LogMetricWriteModule,
    MetricWriteModule,
    MetricRegisterWriteModule,
  ],
  providers: [ProjectRemovalService],
  exports: [ProjectRemovalService],
})
export class ProjectRemovalModule {}
