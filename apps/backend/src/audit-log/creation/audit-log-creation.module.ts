import { Global, Module } from '@nestjs/common';
import { AuditLog } from './audit-log-creation.service';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { AuditLogWriteModule } from '../write/audit-log-write.module';
import { PublicDashboardReadModule } from '../../public-dashboard/read/public-dashboard-read.module';
import { CustomDomainReadModule } from '../../custom-domain/read/custom-domain-read.module';

@Global()
@Module({
  imports: [
    ProjectReadModule,
    ClusterReadModule,
    MetricRegisterReadModule,
    AuditLogWriteModule,
    PublicDashboardReadModule,
    CustomDomainReadModule,
  ],
  providers: [AuditLog],
  exports: [AuditLog],
})
export class AuditLogCreationModule {}
