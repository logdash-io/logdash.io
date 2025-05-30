import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogMetricWriteService } from '../write/log-metric-write.service';
import { subHours } from 'date-fns';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { ProjectReadService } from '../../project/read/project-read.service';
import { ProjectTier } from '../../project/core/enums/project-tier.enum';
import { RemoveLogMetricsDto } from '../write/dto/remove-log-metrics.dto';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class LogMetricTtlService {
  constructor(
    private readonly logMetricWriteService: LogMetricWriteService,
    private readonly projectReadService: ProjectReadService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async removeOldLogMetrics(): Promise<void> {
    const cursor = this.projectReadService.getProjectsForLogMetricRemoval();

    const now = Date.now();

    for await (const batch of cursor) {
      const dtos: RemoveLogMetricsDto[] = [];

      for (const project of batch) {
        const projectDtos = await this.getRemovalDtosForOneProject({
          projectId: project.id,
          tier: project.tier,
        });

        dtos.push(...projectDtos);
      }

      await this.logMetricWriteService.removeMany(dtos);
    }

    const durationMs = Date.now() - now;

    this.logger.log(`Removed old log metrics`, { duration: durationMs });
  }

  private async getRemovalDtosForOneProject(params: {
    projectId: string;
    tier: ProjectTier;
  }): Promise<RemoveLogMetricsDto[]> {
    const minuteMetricsHours = getProjectPlanConfig(params.tier).logMetrics
      .keepGranularitiesForHours[MetricGranularity.Minute];

    const hourMetricsHours = getProjectPlanConfig(params.tier).logMetrics
      .keepGranularitiesForHours[MetricGranularity.Hour];

    const dayMetricsHours = getProjectPlanConfig(params.tier).logMetrics
      .keepGranularitiesForHours[MetricGranularity.Day];

    const minuteGranularityCutoff = subHours(new Date(), minuteMetricsHours);
    const hourGranularityCutoff = subHours(new Date(), hourMetricsHours);
    const dayGranularityCutoff = subHours(new Date(), dayMetricsHours);

    const minuteDto: RemoveLogMetricsDto = {
      projectId: params.projectId,
      olderThan: minuteGranularityCutoff,
      granularity: MetricGranularity.Minute,
    };

    const hourDto: RemoveLogMetricsDto = {
      projectId: params.projectId,
      olderThan: hourGranularityCutoff,
      granularity: MetricGranularity.Hour,
    };

    const dayDto: RemoveLogMetricsDto = {
      projectId: params.projectId,
      olderThan: dayGranularityCutoff,
      granularity: MetricGranularity.Day,
    };

    return [minuteDto, hourDto, dayDto];
  }
}
