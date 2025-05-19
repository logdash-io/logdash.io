import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from '../../user/events/user-events.enum';
import { UserTierChangedEvent } from '../../user/events/definitions/user-logged-in.event';
import { ProjectWriteService } from '../write/project-write.service';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { ProjectTier } from './enums/project-tier.enum';
import { ProjectReadService } from '../read/project-read.service';
import { ClusterWriteService } from '../../cluster/write/cluster-write.service';
import { clusterTierFromProjectTier } from '../../cluster/core/enums/cluster-tier.enum';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class ProjectCoreService {
  constructor(
    private readonly projectWriteService: ProjectWriteService,
    private readonly projectReadService: ProjectReadService,
    private readonly clusterWriteService: ClusterWriteService,
    private readonly logger: Logger,
  ) {}

  @OnEvent(UserEvents.UserTierChanged)
  public async updateProjectsTiers(
    payload: UserTierChangedEvent,
  ): Promise<void> {
    const newProjectTier = {
      [UserTier.Free]: ProjectTier.Free,
      [UserTier.EarlyBird]: ProjectTier.EarlyBird,
    }[payload.newTier];

    await this.projectWriteService.updateTiersByCreatorId(
      payload.userId,
      newProjectTier,
    );
  }
}
