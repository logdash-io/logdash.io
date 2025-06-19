import { Global, Module } from '@nestjs/common';
import { AuditLog } from './audit-log-write.service';

@Global()
@Module({
  providers: [AuditLog],
  exports: [AuditLog],
})
export class AuditLogWriteModule {}
