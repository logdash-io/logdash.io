import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subHours } from 'date-fns';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { ProjectReadService } from '../../project/read/project-read.service';
import { ProjectTier } from '../../project/core/enums/project-tier.enum';
import { MetricWriteService } from '../write/metric-write.service';
import { RemoveMetricsDto } from '../write/dto/remove-metrics.dto';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { METRICS_LOGGER } from '../../shared/logdash/logdash-tokens';

@Injectable()
export class MetricTtlService {
  constructor(
    private readonly metricWriteService: MetricWriteService,
    private readonly projectReadService: ProjectReadService,
    @Inject(METRICS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async removeOldMetrics(): Promise<void> {
    const cursor = this.projectReadService.getProjectsForMetricRemoval();

    const now = Date.now();

    for await (const batch of cursor) {
      const dtos: RemoveMetricsDto[] = [];

      for (const project of batch) {
        const projectDtos = await this.getRemovalDtosForOneProject({
          projectId: project.id,
          tier: project.tier,
        });

        dtos.push(...projectDtos);
      }

      await this.metricWriteService.removeMany(dtos);
    }

    const durationMs = Date.now() - now;

    this.logger.log(`Removed old metrics`, { durationMs });
  }

  private async getRemovalDtosForOneProject(params: {
    projectId: string;
    tier: ProjectTier;
  }): Promise<RemoveMetricsDto[]> {
    const minuteMetricsHours = getProjectPlanConfig(params.tier).metrics.keepGranularitiesForHours[
      MetricGranularity.Minute
    ];

    const hourMetricsHours = getProjectPlanConfig(params.tier).metrics.keepGranularitiesForHours[
      MetricGranularity.Hour
    ];

    const dayMetricsHours = getProjectPlanConfig(params.tier).metrics.keepGranularitiesForHours[
      MetricGranularity.Day
    ];

    const minuteGranularityCutoff = subHours(new Date(), minuteMetricsHours);
    const hourGranularityCutoff = subHours(new Date(), hourMetricsHours);
    const dayGranularityCutoff = subHours(new Date(), dayMetricsHours);

    const minuteDto: RemoveMetricsDto = {
      projectId: params.projectId,
      olderThan: minuteGranularityCutoff,
      granularity: MetricGranularity.Minute,
    };

    const hourDto: RemoveMetricsDto = {
      projectId: params.projectId,
      olderThan: hourGranularityCutoff,
      granularity: MetricGranularity.Hour,
    };

    const dayDto: RemoveMetricsDto = {
      projectId: params.projectId,
      olderThan: dayGranularityCutoff,
      granularity: MetricGranularity.Day,
    };

    return [minuteDto, hourDto, dayDto];
  }
}
