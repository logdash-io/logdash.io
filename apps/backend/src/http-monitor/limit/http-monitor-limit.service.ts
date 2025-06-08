import { Injectable } from '@nestjs/common';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';

@Injectable()
export class HttpMonitorLimitService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly projectReadCachedService: ProjectReadCachedService,
  ) {}

  public async hasCapacity(projectId: string): Promise<boolean> {
    const monitorsCount = await this.httpMonitorReadService.countByProjectId(projectId);
    const project = await this.projectReadCachedService.readProject(projectId);

    if (!project) {
      return false;
    }

    const allowedCount = getProjectPlanConfig(project.tier).httpMonitors.maxNumberOfMonitors;

    return monitorsCount + 1 <= allowedCount;
  }
}
