import { Global, Module } from '@nestjs/common';
import { AuditLogWriteService } from './audit-log-write.service';

@Module({
  providers: [AuditLogWriteService],
  exports: [AuditLogWriteService],
})
export class AuditLogWriteModule {}
