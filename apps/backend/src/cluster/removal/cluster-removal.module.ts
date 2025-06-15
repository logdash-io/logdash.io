import { Module } from '@nestjs/common';
import { ClusterReadModule } from '../read/cluster-read.module';
import { ClusterWriteModule } from '../write/cluster-write.module';
import { ProjectRemovalModule } from '../../project/removal/project-removal.module';
import { ClusterRemovalService } from './cluster-removal.service';
import { PublicDashboardWriteModule } from '../../public-dashboard/write/public-dashboard-write.module';

@Module({
  imports: [
    ClusterReadModule,
    ClusterWriteModule,
    ProjectRemovalModule,
    PublicDashboardWriteModule,
  ],
  providers: [ClusterRemovalService],
  exports: [ClusterRemovalService],
})
export class ClusterRemovalModule {}
