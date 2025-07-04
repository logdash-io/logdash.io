import { Module } from '@nestjs/common';
import { ApiKeyWriteModule } from '../../api-key/write/api-key-write.module';
import { ClusterWriteModule } from '../../cluster/write/cluster-write.module';
import { LogRateLimitModule } from '../../log/rate-limit/log-rate-limit.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { ProjectEventModule } from '../events/project-event.module';
import { ProjectFeaturesModule } from '../features/project-features.module';
import { ProjectLimitModule } from '../limit/project-limit-module';
import { ProjectReadModule } from '../read/project-read.module';
import { ProjectRemovalModule } from '../removal/project-removal.module';
import { ProjectWriteModule } from '../write/project-write.module';
import { ProjectCoreController } from './project-core.controller';
import { ProjectCoreService } from './project-core.service';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Module({
  imports: [
    ProjectReadModule,
    ProjectWriteModule,
    ProjectEventModule,
    ApiKeyWriteModule,
    ProjectLimitModule,
    ClusterWriteModule,
    UserReadModule,
    ProjectFeaturesModule,
    LogRateLimitModule,
    ProjectRemovalModule,
    ...ClusterMemberGuardImports,
  ],
  providers: [ProjectCoreService],
  controllers: [ProjectCoreController],
  exports: [ProjectFeaturesModule],
})
export class ProjectCoreModule {}
