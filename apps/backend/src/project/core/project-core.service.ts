import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from '../../user/events/user-events.enum';
import { UserTierChangedEvent } from '../../user/events/definitions/user-tier-changed.event';
import { ProjectWriteService } from '../write/project-write.service';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { ProjectTier } from './enums/project-tier.enum';

@Injectable()
export class ProjectCoreService {
  constructor(private readonly projectWriteService: ProjectWriteService) {}

  @OnEvent(UserEvents.UserTierChanged)
  public async updateProjectsTiers(payload: UserTierChangedEvent): Promise<void> {
    const newProjectTier = {
      [UserTier.Free]: ProjectTier.Free,
      [UserTier.EarlyBird]: ProjectTier.EarlyBird,
      [UserTier.Contributor]: ProjectTier.Contributor,
      [UserTier.Admin]: ProjectTier.Admin,
    }[payload.newTier];

    await this.projectWriteService.updateTiersByCreatorId(payload.userId, newProjectTier);
  }
}
