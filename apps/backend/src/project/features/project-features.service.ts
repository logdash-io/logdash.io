import { Injectable } from '@nestjs/common';
import { ProjectFeature } from '../core/enums/project-feature.enum';
import { LogReadService } from '../../log/read/log-read.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class ProjectFeaturesService {
  constructor(
    private readonly logReadService: LogReadService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly logger: Logger,
  ) {}

  async getProjectFeatures(projectId: string): Promise<ProjectFeature[]> {
    const features: ProjectFeature[] = [];

    try {
      const hasLogs = await this.logReadService.existsForProject(projectId);
      if (hasLogs) {
        features.push(ProjectFeature.logging);
      }
    } catch (error) {
      this.logger.error('Error checking if project has logs', {
        projectId,
        error: error.message,
      });
    }

    try {
      const hasMetrics = await this.metricRegisterReadService.existsForProject(projectId);
      if (hasMetrics) {
        features.push(ProjectFeature.metrics);
      }
    } catch (error) {
      this.logger.error('Error checking if project has metrics', {
        projectId,
        error: error.message,
      });
    }

    try {
      const hasHttpMonitors = await this.httpMonitorReadService.existsForProject(projectId);
      if (hasHttpMonitors) {
        features.push(ProjectFeature.monitoring);
      }
    } catch (error) {
      this.logger.error('Error checking if project has http monitors', {
        projectId,
        error: error.message,
      });
    }

    return features;
  }

  async getProjectFeaturesMany(projectIds: string[]): Promise<Record<string, ProjectFeature[]>> {
    const result: Record<string, ProjectFeature[]> = {};

    await Promise.all(
      projectIds.map(async (projectId) => {
        result[projectId] = await this.getProjectFeatures(projectId);
      }),
    );

    return result;
  }
}
