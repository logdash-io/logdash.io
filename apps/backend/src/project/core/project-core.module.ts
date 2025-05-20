import { Module } from '@nestjs/common';
import { ProjectCoreController } from './project-core.controller';
import { ProjectReadModule } from '../read/project-read.module';
import { ProjectWriteModule } from '../write/project-write.module';
import { ProjectCoreService } from './project-core.service';
import { ProjectEventModule } from '../events/project-event.module';
import { ApiKeyWriteModule } from '../../api-key/write/api-key-write.module';
import { ProjectLimitModule } from '../limit/project-limit-module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { ClusterWriteModule } from '../../cluster/write/cluster-write.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { ProjectFeaturesModule } from '../features/project-features.module';
import { LogRateLimitModule } from '../../log/rate-limit/log-rate-limit.module';

@Module({
  imports: [
    ProjectReadModule,
    ProjectWriteModule,
    ProjectEventModule,
    ApiKeyWriteModule,
    ProjectLimitModule,
    ClusterReadModule,
    ClusterWriteModule,
    UserReadModule,
    ProjectFeaturesModule,
    LogRateLimitModule,
  ],
  providers: [ProjectCoreService],
  controllers: [ProjectCoreController],
  exports: [ProjectFeaturesModule],
})
export class ProjectCoreModule {}
