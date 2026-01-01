import { Injectable } from '@nestjs/common';
import { ProjectReadService } from '../read/project-read.service';
import { getUserPlanConfig } from '../../shared/configs/user-plan-configs';
import { UserReadCachedService } from '../../user/read/user-read-cached.service';

@Injectable()
export class ProjectLimitService {
  constructor(
    private readonly projectReadService: ProjectReadService,
    private readonly userReadCachedService: UserReadCachedService,
  ) {}

  public async newProjectWouldBeWithinLimit(userId: string): Promise<boolean> {
    const tier = await this.userReadCachedService.readTier(userId);

    const allowedNumberOfProjects = getUserPlanConfig(tier).projects.maxNumberOfProjects;

    const currentNumberOfProjects = await this.projectReadService.countProjectsByCreatorId(userId);

    return currentNumberOfProjects + 1 <= allowedNumberOfProjects;
  }
}
