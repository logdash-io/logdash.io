import { Module } from '@nestjs/common';
import { LogReadModule } from '../../log/read/log-read.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { ProjectFeaturesService } from './project-features.service';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';

@Module({
  imports: [LogReadModule, MetricRegisterReadModule, HttpMonitorReadModule],
  providers: [ProjectFeaturesService],
  exports: [ProjectFeaturesService],
})
export class ProjectFeaturesModule {}
