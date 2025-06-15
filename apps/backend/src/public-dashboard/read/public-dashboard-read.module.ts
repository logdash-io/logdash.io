import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PublicDashboardEntity,
  PublicDashboardSchema,
} from '../core/entities/public-dashboard.entity';
import { PublicDashboardReadService } from './public-dashboard-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicDashboardEntity.name, schema: PublicDashboardSchema },
    ]),
  ],
  providers: [PublicDashboardReadService],
  exports: [PublicDashboardReadService],
})
export class PublicDashboardReadModule {}
