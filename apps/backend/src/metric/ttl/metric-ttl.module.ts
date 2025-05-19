import { Module } from '@nestjs/common';
import { MetricTtlService } from './metric-ttl.service';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ProjectWriteModule } from '../../project/write/project-write.module';
import { MetricWriteModule } from '../write/metric-write.module';

@Module({
  imports: [ProjectReadModule, ProjectWriteModule, MetricWriteModule],
  providers: [MetricTtlService],
})
export class MetricTtlModule {}
