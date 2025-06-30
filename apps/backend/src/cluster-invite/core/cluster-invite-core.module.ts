import { Module } from '@nestjs/common';
import { ClusterInviteCoreController } from './cluster-invite-core.controller';
import { ClusterInviteReadModule } from '../read/cluster-invite-read.module';
import { ClusterInviteWriteModule } from '../write/cluster-invite-write.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { ClusterWriteModule } from '../../cluster/write/cluster-write.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { ClusterInviteLimitModule } from '../limit/cluster-invite-limit.module';

@Module({
  imports: [
    ClusterInviteReadModule,
    ClusterInviteWriteModule,
    UserReadModule,
    ClusterWriteModule,
    ClusterReadModule,
    ClusterInviteLimitModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [ClusterInviteCoreController],
  exports: [ClusterInviteReadModule, ClusterInviteWriteModule],
})
export class ClusterInviteCoreModule {}
