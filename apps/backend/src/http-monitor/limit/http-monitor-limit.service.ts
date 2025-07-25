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
    const notClaimedMonitorsCount =
      await this.httpMonitorReadService.countNotClaimedByProjectId(projectId);

    if (notClaimedMonitorsCount > 100) {
      return false;
    }

    const claimedMonitorsCount =
      await this.httpMonitorReadService.countClaimedByProjectId(projectId);
    const project = await this.projectReadCachedService.readProject(projectId);

    if (!project) {
      return false;
    }

    const allowedCount = getProjectPlanConfig(project.tier).httpMonitors.maxNumberOfMonitors;

    return claimedMonitorsCount + 1 <= allowedCount;
  }
}
