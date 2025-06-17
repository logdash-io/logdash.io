import { Injectable } from '@nestjs/common';
import { ClusterWriteService } from '../write/cluster-write.service';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from '../../user/events/user-events.enum';
import { UserTierChangedEvent } from '../../user/events/definitions/user-tier-changed.event';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { ClusterTier } from './enums/cluster-tier.enum';

@Injectable()
export class ClusterCoreService {
  constructor(private readonly clusterWriteService: ClusterWriteService) {}

  @OnEvent(UserEvents.UserTierChanged)
  public async updateClustersTiers(payload: UserTierChangedEvent): Promise<void> {
    const newProjectTier = {
      [UserTier.Free]: ClusterTier.Free,
      [UserTier.Contributor]: ClusterTier.Contributor,
      [UserTier.EarlyBird]: ClusterTier.EarlyBird,
      [UserTier.Admin]: ClusterTier.Admin,
    }[payload.newTier];

    await this.clusterWriteService.updateTiersByCreatorId(payload.userId, newProjectTier);
  }
}
