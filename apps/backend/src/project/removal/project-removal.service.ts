import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { LogMetricWriteService } from '../../log-metric/write/log-metric-write.service';
import { LogWriteService } from '../../log/write/log-write.service';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricWriteService } from '../../metric/write/metric-write.service';
import { ProjectReadService } from '../read/project-read.service';
import { ProjectWriteService } from '../write/project-write.service';
import { HttpMonitorRemovalService } from '../../http-monitor/removal/http-monitor-removal.service';
import { ApiKeyWriteService } from '../../api-key/write/api-key-write.service';
import { PublicDashboardWriteService } from '../../public-dashboard/write/public-dashboard-write.service';

@Injectable()
export class ProjectRemovalService {
  constructor(
    private readonly projectReadService: ProjectReadService,
    private readonly projectWriteService: ProjectWriteService,
    private readonly logWriteService: LogWriteService,
    private readonly metricWriteService: MetricWriteService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly logMetricWriteService: LogMetricWriteService,
    private readonly logger: Logger,
    private readonly httpMonitorRemovalService: HttpMonitorRemovalService,
    private readonly apiKeyWriteService: ApiKeyWriteService,
  ) {}

  public async deleteProjectsByClusterId(clusterId: string, actorUserId?: string): Promise<void> {
    const projects = await this.projectReadService.readByClusterId(clusterId);

    for (const project of projects) {
      await this.deleteProjectById(project.id, actorUserId);
    }
  }

  public async deleteProjectById(projectId: string, actorUserId?: string): Promise<void> {
    this.logger.log(`Deleting project...`, {
      projectId,
    });
    await this.projectWriteService.delete(projectId, actorUserId);

    this.logger.log(`Deleting logs for project...`, {
      projectId,
    });
    await this.logWriteService.deleteBelongingToProject(projectId);

    this.logger.log(`Deleting metrics for project...`, {
      projectId,
    });
    await this.metricWriteService.deleteBelongingToProject(projectId);

    this.logger.log(`Deleting metric register entries for project...`, {
      projectId,
    });
    await this.metricRegisterWriteService.deleteBelongingToProject(projectId);

    this.logger.log(`Deleting log metrics for project...`, {
      projectId,
    });
    await this.logMetricWriteService.deleteBelongingToProject(projectId);

    this.logger.log(`Deleting HTTP monitors for project...`, {
      projectId,
    });
    await this.httpMonitorRemovalService.deleteByProjectId(projectId);

    this.logger.log(`Deleting API keys for project...`, {
      projectId,
    });
    await this.apiKeyWriteService.deleteByProjectId(projectId);
  }
}
