import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PublicDashboardEntity,
  PublicDashboardSchema,
} from '../core/entities/public-dashboard.entity';
import { PublicDashboardWriteService } from './public-dashboard-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicDashboardEntity.name, schema: PublicDashboardSchema },
    ]),
  ],
  providers: [PublicDashboardWriteService],
  exports: [PublicDashboardWriteService],
})
export class PublicDashboardWriteModule {}
