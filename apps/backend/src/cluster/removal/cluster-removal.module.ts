import { Module } from '@nestjs/common';
import { ClusterReadModule } from '../read/cluster-read.module';
import { ClusterWriteModule } from '../write/cluster-write.module';
import { ProjectRemovalModule } from '../../project/removal/project-removal.module';
import { ClusterRemovalService } from './cluster-removal.service';
import { PublicDashboardRemovalModule } from '../../public-dashboard/removal/public-dashboard-removal.module';
import { WebAnalyticsWriteModule } from '../../web-analytics/write/web-analytics-write.module';
import { HttpMonitorRemovalModule } from '../../http-monitor/removal/http-monitor-removal.module';
import { NotificationChannelWriteModule } from '../../notification-channel/write/notification-channel-write.module';

@Module({
  imports: [
    ClusterReadModule,
    ClusterWriteModule,
    ProjectRemovalModule,
    PublicDashboardRemovalModule,
    WebAnalyticsWriteModule,
    HttpMonitorRemovalModule,
    NotificationChannelWriteModule,
  ],
  providers: [ClusterRemovalService],
  exports: [ClusterRemovalService],
})
export class ClusterRemovalModule {}
