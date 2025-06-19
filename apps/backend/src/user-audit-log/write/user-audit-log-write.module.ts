import { Module } from '@nestjs/common';
import { UserAuditLogWriteService } from './user-audit-log-write.service';

@Module({
  providers: [UserAuditLogWriteService],
  exports: [UserAuditLogWriteService],
})
export class UserAuditLogWriteModule {}
