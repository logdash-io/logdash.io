import { Module } from '@nestjs/common';
import { ClusterReadModule } from '../read/cluster-read.module';
import { ClusterWriteModule } from '../write/cluster-write.module';
import { ProjectRemovalModule } from '../../project/removal/project-removal.module';
import { ClusterRemovalService } from './cluster-removal.service';
import { PublicDashboardRemovalModule } from '../../public-dashboard/removal/public-dashboard-removal.module';

@Module({
  imports: [
    ClusterReadModule,
    ClusterWriteModule,
    ProjectRemovalModule,
    PublicDashboardRemovalModule,
  ],
  providers: [ClusterRemovalService],
  exports: [ClusterRemovalService],
})
export class ClusterRemovalModule {}
