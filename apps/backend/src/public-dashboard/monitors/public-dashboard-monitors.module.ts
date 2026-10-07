import { Module } from '@nestjs/common';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { PublicDashboardReadModule } from '../read/public-dashboard-read.module';
import { PublicDashboardWriteModule } from '../write/public-dashboard-write.module';
import { PublicDashboardLimitModule } from '../limit/public-dashboard-limit.module';
import { PublicDashboardCompositionModule } from '../composition/public-dashboard-composition.module';
import { StatusPageCompositionModule } from '../../status-page/composition/status-page-composition.module';
import { PublicDashboardMonitorsService } from './public-dashboard-monitors.service';

@Module({
  imports: [
    ClusterReadModule,
    PublicDashboardReadModule,
    PublicDashboardWriteModule,
    PublicDashboardLimitModule,
    PublicDashboardCompositionModule,
    StatusPageCompositionModule,
  ],
  providers: [PublicDashboardMonitorsService],
  exports: [PublicDashboardMonitorsService],
})
export class PublicDashboardMonitorsModule {}
