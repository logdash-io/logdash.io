import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PublicDashboardEntity,
  PublicDashboardSchema,
} from '../core/entities/public-dashboard.entity';
import { PublicDashboardReadService } from './public-dashboard-read.service';
import { CustomDomainReadModule } from '../../custom-domain/read/custom-domain-read.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicDashboardEntity.name, schema: PublicDashboardSchema },
    ]),
    CustomDomainReadModule,
  ],
  providers: [PublicDashboardReadService],
  exports: [PublicDashboardReadService],
})
export class PublicDashboardReadModule {}
