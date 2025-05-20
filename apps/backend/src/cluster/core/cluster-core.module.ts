import { Module } from '@nestjs/common';
import { ClusterCoreController } from './cluster-core.controller';
import { ClusterReadModule } from '../read/cluster-read.module';
import { ClusterWriteModule } from '../write/cluster-write.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ClusterFeaturesModule } from '../features/cluster-features.module';

@Module({
  imports: [
    ClusterReadModule,
    ClusterWriteModule,
    UserReadModule,
    ProjectReadModule,
    ClusterFeaturesModule,
  ],
  controllers: [ClusterCoreController],
  exports: [ClusterFeaturesModule],
})
export class ClusterCoreModule {}
