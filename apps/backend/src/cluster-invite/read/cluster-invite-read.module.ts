import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClusterInviteEntity, ClusterInviteSchema } from '../core/entities/cluster-invite.entity';
import { ClusterInviteReadService } from './cluster-invite-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ClusterInviteEntity.name,
        schema: ClusterInviteSchema,
      },
    ]),
  ],
  providers: [ClusterInviteReadService],
  exports: [ClusterInviteReadService],
})
export class ClusterInviteReadModule {}
