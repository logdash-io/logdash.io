import { Module } from '@nestjs/common';
import { PublicDashboardReadModule } from '../read/public-dashboard-read.module';
import { PublicDashboardWriteModule } from '../write/public-dashboard-write.module';
import { CustomDomainWriteModule } from '../../custom-domain/write/custom-domain-write.module';
import { PublicDashboardRemovalService } from './public-dashboard-removal.service';

@Module({
  imports: [PublicDashboardReadModule, PublicDashboardWriteModule, CustomDomainWriteModule],
  providers: [PublicDashboardRemovalService],
  exports: [PublicDashboardRemovalService],
})
export class PublicDashboardRemovalModule {}
