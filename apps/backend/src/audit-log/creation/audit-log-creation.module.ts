import { Global, Module } from '@nestjs/common';
import { AuditLog } from './audit-log-creation.service';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { MetricRegisterReadModule } from '../../metric-register/read/metric-register-read.module';
import { AuditLogWriteModule } from '../write/audit-log-write.module';

@Global()
@Module({
  imports: [ProjectReadModule, ClusterReadModule, MetricRegisterReadModule, AuditLogWriteModule],
  providers: [AuditLog],
  exports: [AuditLog],
})
export class AuditLogCreationModule {}
