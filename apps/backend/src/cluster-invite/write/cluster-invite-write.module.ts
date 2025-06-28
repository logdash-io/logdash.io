import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClusterInviteEntity, ClusterInviteSchema } from '../core/entities/cluster-invite.entity';
import { ClusterInviteWriteService } from './cluster-invite-write.service';
import { AuditLogCreationModule } from '../../audit-log/creation/audit-log-creation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ClusterInviteEntity.name,
        schema: ClusterInviteSchema,
      },
    ]),
    AuditLogCreationModule,
  ],
  providers: [ClusterInviteWriteService],
  exports: [ClusterInviteWriteService],
})
export class ClusterInviteWriteModule {}
