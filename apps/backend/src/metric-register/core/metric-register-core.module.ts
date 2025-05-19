import { Module } from '@nestjs/common';
import { MetricRegisterCoreController } from './metric-register-core.controller';
import { MetricRegisterWriteModule } from '../write/metric-register-write.module';
import { MetricWriteModule } from '../../metric/write/metric-write.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';

@Module({
  imports: [
    MetricRegisterWriteModule,
    MetricWriteModule,
    ClusterReadModule,
    ProjectReadModule,
  ],
  controllers: [MetricRegisterCoreController],
})
export class MetricRegisterCoreModule {}
