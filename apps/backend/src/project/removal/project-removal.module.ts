import { Module } from '@nestjs/common';
import { HttpMonitorWriteModule } from '../../http-monitor/write/http-monitor-write.module';
import { LogWriteModule } from '../../log/write/log-write.module';
import { MetricRegisterWriteModule } from '../../metric-register/write/metric-register-write.module';
import { MetricWriteModule } from '../../metric/write/metric-write.module';
import { ProjectReadModule } from '../read/project-read.module';
import { ProjectWriteModule } from '../write/project-write.module';
import { ProjectRemovalService } from './project-removal.service';
import { ApiKeyWriteModule } from '../../api-key/write/api-key-write.module';

@Module({
  imports: [
    ProjectReadModule,
    ProjectWriteModule,
    LogWriteModule,
    MetricWriteModule,
    MetricRegisterWriteModule,
    HttpMonitorWriteModule,
    ApiKeyWriteModule,
  ],
  providers: [ProjectRemovalService],
  exports: [ProjectRemovalService],
})
export class ProjectRemovalModule {}
