import { Module } from '@nestjs/common';
import { PublicDashboardLimitService } from './public-dashboard-limit.service';
import { PublicDashboardReadModule } from '../read/public-dashboard-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { UserReadModule } from '../../user/read/user-read.module';

@Module({
  imports: [PublicDashboardReadModule, ClusterReadModule, UserReadModule],
  providers: [PublicDashboardLimitService],
  exports: [PublicDashboardLimitService],
})
export class PublicDashboardLimitModule {}
