import { Injectable } from '@nestjs/common';
import { ProjectReadService } from '../read/project-read.service';
import { ProjectWriteService } from '../write/project-write.service';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricWriteService } from '../../metric/write/metric-write.service';
import { LogWriteService } from '../../log/write/log-write.service';
import { LogMetricWriteService } from '../../log-metric/write/log-metric-write.service';
import { Logger } from '@logdash/js-sdk';

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
  ) {}

  // optimize: can be optimized to only read ids
  public async deleteProjectsByClusterId(clusterId: string): Promise<void> {
    const projects = await this.projectReadService.readByClusterId(clusterId);

    for (const project of projects) {
      this.logger.log(`Deleting project...`, {
        projectId: project.id,
      });
      await this.projectWriteService.delete(project.id);

      this.logger.log(`Deleting logs for project...`, {
        projectId: project.id,
      });
      await this.logWriteService.deleteBelongingToProject(project.id);

      this.logger.log(`Deleting metrics for project...`, {
        projectId: project.id,
      });
      await this.metricWriteService.deleteBelongingToProject(project.id);

      this.logger.log(`Deleting metric register entries for project...`, {
        projectId: project.id,
      });
      await this.metricRegisterWriteService.deleteBelongingToProject(
        project.id,
      );

      this.logger.log(`Deleting log metrics for project...`, {
        projectId: project.id,
      });
      await this.logMetricWriteService.deleteBelongingToProject(project.id);
    }
  }
}
