import { Module } from '@nestjs/common';
import { ClusterInviteReadModule } from '../read/cluster-invite-read.module';
import { ClusterInviteLimitService } from './cluster-invite-limit.service';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';

@Module({
  imports: [ClusterInviteReadModule, ClusterReadModule],
  providers: [ClusterInviteLimitService],
  exports: [ClusterInviteLimitService],
})
export class ClusterInviteLimitModule {}
