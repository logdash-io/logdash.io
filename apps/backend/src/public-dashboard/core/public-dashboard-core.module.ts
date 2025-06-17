import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicDashboardEntity, PublicDashboardSchema } from './entities/public-dashboard.entity';
import { PublicDashboardCoreController } from './public-dashboard-core.controller';
import { PublicDashboardReadModule } from '../read/public-dashboard-read.module';
import { PublicDashboardWriteModule } from '../write/public-dashboard-write.module';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { PublicDashboardCompositionModule } from '../composition/public-dashboard-composition.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicDashboardEntity.name, schema: PublicDashboardSchema },
    ]),
    PublicDashboardReadModule,
    PublicDashboardWriteModule,
    HttpMonitorReadModule,
    ProjectReadModule,
    PublicDashboardCompositionModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [PublicDashboardCoreController],
  providers: [],
  exports: [],
})
export class PublicDashboardCoreModule {}
