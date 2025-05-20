import { Injectable } from '@nestjs/common';
import { ClusterWriteService } from '../write/cluster-write.service';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from '../../user/events/user-events.enum';
import { UserTierChangedEvent } from '../../user/events/definitions/user-logged-in.event';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { ClusterTier } from './enums/cluster-tier.enum';

@Injectable()
export class ClusterCoreService {
  constructor(private readonly clusterWriteService: ClusterWriteService) {}

  @OnEvent(UserEvents.UserTierChanged)
  public async updateClustersTiers(
    payload: UserTierChangedEvent,
  ): Promise<void> {
    const newProjectTier = {
      [UserTier.Free]: ClusterTier.Free,
      [UserTier.EarlyBird]: ClusterTier.EarlyBird,
    }[payload.newTier];

    await this.clusterWriteService.updateTiersByCreatorId(
      payload.userId,
      newProjectTier,
    );
  }
}
