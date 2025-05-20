import { Injectable } from '@nestjs/common';
import { ProjectFeature } from '../core/enums/project-feature.enum';
import { LogReadService } from '../../log/read/log-read.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';

@Injectable()
export class ProjectFeaturesService {
  constructor(
    private readonly logReadService: LogReadService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
  ) {}

  async getProjectFeatures(projectId: string): Promise<ProjectFeature[]> {
    const features: ProjectFeature[] = [];

    try {
      const hasLogs = await this.logReadService.existsForProject(projectId);
      if (hasLogs) {
        features.push(ProjectFeature.logging);
      }
    } catch (error) {}

    try {
      const hasMetrics =
        await this.metricRegisterReadService.existsForProject(projectId);
      if (hasMetrics) {
        features.push(ProjectFeature.metrics);
      }
    } catch (error) {}

    return features;
  }

  async getProjectFeaturesMany(
    projectIds: string[],
  ): Promise<Record<string, ProjectFeature[]>> {
    const result: Record<string, ProjectFeature[]> = {};

    await Promise.all(
      projectIds.map(async (projectId) => {
        result[projectId] = await this.getProjectFeatures(projectId);
      }),
    );

    return result;
  }
}
