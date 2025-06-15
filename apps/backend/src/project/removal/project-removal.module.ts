import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from 'src/http-monitor/read/http-monitor-read.module';
import { HttpMonitorWriteModule } from 'src/http-monitor/write/http-monitor-write.module';
import { HttpPingWriteModule } from 'src/http-ping/write/http-ping-write.module';
import { LogMetricWriteModule } from '../../log-metric/write/log-metric-write.module';
import { LogWriteModule } from '../../log/write/log-write.module';
import { MetricRegisterWriteModule } from '../../metric-register/write/metric-register-write.module';
import { MetricWriteModule } from '../../metric/write/metric-write.module';
import { ProjectReadModule } from '../read/project-read.module';
import { ProjectWriteModule } from '../write/project-write.module';
import { ProjectRemovalService } from './project-removal.service';
import { HttpMonitorRemovalModule } from '../../http-monitor/removal/http-monitor-removal.module';
import { ApiKeyWriteModule } from '../../api-key/write/api-key-write.module';

@Module({
  imports: [
    ProjectReadModule,
    ProjectWriteModule,
    LogWriteModule,
    LogMetricWriteModule,
    MetricWriteModule,
    MetricRegisterWriteModule,
    HttpPingWriteModule,
    HttpMonitorWriteModule,
    HttpMonitorReadModule,
    HttpMonitorRemovalModule,
    ApiKeyWriteModule,
  ],
  providers: [ProjectRemovalService],
  exports: [ProjectRemovalService],
})
export class ProjectRemovalModule {}
