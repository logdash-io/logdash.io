import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from '../../user/events/user-events.enum';
import { UserTierChangedEvent } from '../../user/events/definitions/user-tier-changed.event';
import { ProjectWriteService } from '../write/project-write.service';
import { projectTierFromUserTier } from './enums/project-tier.enum';

@Injectable()
export class ProjectCoreService {
  constructor(private readonly projectWriteService: ProjectWriteService) {}

  @OnEvent(UserEvents.UserTierChanged)
  public async updateProjectsTiers(payload: UserTierChangedEvent): Promise<void> {
    const newProjectTier = projectTierFromUserTier(payload.newTier);

    await this.projectWriteService.updateTiersByCreatorId(payload.userId, newProjectTier);
  }
}
