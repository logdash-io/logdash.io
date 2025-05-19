import { Module } from '@nestjs/common';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { HttpMonitorLimitModule } from '../limit/http-monitor-limit.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorWriteModule } from '../write/http-monitor-write.module';
import { HttpMonitorCoreController } from './http-monitor-core.controller';

@Module({
  imports: [
    HttpMonitorReadModule,
    HttpMonitorWriteModule,
    HttpMonitorLimitModule,
    ProjectReadModule,
    ClusterReadModule,
  ],
  controllers: [HttpMonitorCoreController],
})
export class HttpMonitorCoreModule {}
