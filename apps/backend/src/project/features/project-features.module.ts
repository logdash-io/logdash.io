import { Module } from '@nestjs/common';
import { LogReadModule } from '../../log/read/log-read.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { ProjectFeaturesService } from './project-features.service';

@Module({
  imports: [LogReadModule, MetricRegisterReadModule],
  providers: [ProjectFeaturesService],
  exports: [ProjectFeaturesService],
})
export class ProjectFeaturesModule {}
