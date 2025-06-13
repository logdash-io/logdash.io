import { Module } from '@nestjs/common';
import { ClusterCoreController } from './cluster-core.controller';
import { ClusterReadModule } from '../read/cluster-read.module';
import { ClusterWriteModule } from '../write/cluster-write.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { ClusterFeaturesModule } from '../features/cluster-features.module';
import { ClusterMemberGuardImports } from '../guards/cluster-member/cluster-member.guard';

@Module({
  imports: [
    ClusterReadModule,
    ClusterWriteModule,
    UserReadModule,
    ClusterFeaturesModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [ClusterCoreController],
  exports: [ClusterFeaturesModule],
})
export class ClusterCoreModule {}
