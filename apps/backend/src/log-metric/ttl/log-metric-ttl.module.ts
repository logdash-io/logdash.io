import { Module } from '@nestjs/common';
import { LogMetricWriteModule } from '../write/log-metric-write.module';
import { LogMetricTtlService } from './log-metric-ttl.service';
import { ProjectReadModule } from '../../project/read/project-read.module';

@Module({
  imports: [LogMetricWriteModule, ProjectReadModule],
  providers: [LogMetricTtlService],
})
export class LogMetricTtlModule {}
