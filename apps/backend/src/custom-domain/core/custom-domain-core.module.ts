import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomDomainEntity, CustomDomainSchema } from './entities/custom-domain.entity';
import { CustomDomainCoreController } from './custom-domain-core.controller';
import { CustomDomainReadModule } from '../read/custom-domain-read.module';
import { CustomDomainWriteModule } from '../write/custom-domain-write.module';
import { PublicDashboardReadModule } from '../../public-dashboard/read/public-dashboard-read.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { CustomDomainRegistrationModule } from '../registration/custom-domain-registration.module';
import { CustomDomainVerificationModule } from '../verification/custom-domain-verification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CustomDomainEntity.name, schema: CustomDomainSchema }]),
    CustomDomainReadModule,
    CustomDomainWriteModule,
    PublicDashboardReadModule,
    CustomDomainRegistrationModule,
    CustomDomainVerificationModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [CustomDomainCoreController],
  providers: [],
  exports: [],
})
export class CustomDomainCoreModule {}
