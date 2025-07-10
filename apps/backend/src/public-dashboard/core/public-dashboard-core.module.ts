import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicDashboardEntity, PublicDashboardSchema } from './entities/public-dashboard.entity';
import { PublicDashboardCoreController } from './public-dashboard-core.controller';
import { PublicDashboardReadModule } from '../read/public-dashboard-read.module';
import { PublicDashboardWriteModule } from '../write/public-dashboard-write.module';
import { PublicDashboardRemovalModule } from '../removal/public-dashboard-removal.module';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { PublicDashboardCompositionModule } from '../composition/public-dashboard-composition.module';
import { PublicDashboardLimitModule } from '../limit/public-dashboard-limit.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicDashboardEntity.name, schema: PublicDashboardSchema },
    ]),
    PublicDashboardReadModule,
    PublicDashboardWriteModule,
    PublicDashboardRemovalModule,
    HttpMonitorReadModule,
    ProjectReadModule,
    PublicDashboardCompositionModule,
    PublicDashboardLimitModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [PublicDashboardCoreController],
  providers: [],
  exports: [],
})
export class PublicDashboardCoreModule {}
