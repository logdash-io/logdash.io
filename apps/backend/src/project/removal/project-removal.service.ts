import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpMonitorWriteService } from '../../http-monitor/write/http-monitor-write.service';
import { HttpPingWriteService } from '../../http-ping/write/http-ping-write.service';
import { LogMetricWriteService } from '../../log-metric/write/log-metric-write.service';
import { LogWriteService } from '../../log/write/log-write.service';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricWriteService } from '../../metric/write/metric-write.service';
import { ProjectReadService } from '../read/project-read.service';
import { ProjectWriteService } from '../write/project-write.service';

@Injectable()
export class ProjectRemovalService {
  constructor(
    private readonly projectReadService: ProjectReadService,
    private readonly projectWriteService: ProjectWriteService,
    private readonly logWriteService: LogWriteService,
    private readonly metricWriteService: MetricWriteService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly logMetricWriteService: LogMetricWriteService,
    private readonly httpPingWriteService: HttpPingWriteService,
    private readonly httpMonitorWriteService: HttpMonitorWriteService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly logger: Logger,
  ) {}

  public async deleteProjectsByClusterId(clusterId: string): Promise<void> {
    const projects = await this.projectReadService.readByClusterId(clusterId);

    for (const project of projects) {
      await this.deleteProjectById(project.id);
    }

    await this.deleteSysHealth(clusterId);
  }

  public async deleteProjectById(projectId: string): Promise<void> {
    this.logger.log(`Deleting project...`, {
      projectId,
    });
    await this.projectWriteService.delete(projectId);

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
  }

  private async deleteSysHealth(clusterId: string): Promise<void> {
    // Get all monitors for the cluster
    const monitors = await this.httpMonitorReadService.readByClusterId(clusterId);
    const monitorsIds = monitors.map((monitor) => monitor.id);

    if (monitorsIds.length > 0) {
      this.logger.log(`Deleting HTTP pings for monitors...`, {
        clusterId,
        monitorCount: monitorsIds.length,
      });
      await this.httpPingWriteService.deleteByMonitorIds(monitorsIds);
    }

    this.logger.log(`Deleting HTTP monitors for cluster...`, {
      clusterId,
    });
    await this.httpMonitorWriteService.deleteBelongingToCluster(clusterId);
  }
}
