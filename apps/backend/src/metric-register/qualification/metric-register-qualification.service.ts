import { Injectable } from '@nestjs/common';
import { MetricRegisterReadService } from '../read/metric-register-read.service';
import { QualifyMetricDto } from './dto/qualify-metric.dto';
import { groupBy } from '../../shared/utils/group-by';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { MetricRegisterWriteService } from '../write/metric-register-write.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { Logger } from '@logdash/js-sdk';

// When customer wants to add metric, he may hit a limit of registered metrics
// as the registration process is automatic. This service is needed as the first
// step when customer requests to ingest a new metric. It will check all metrics
// customer wants to record and then return list of metrics which qualify. It may
// happen that customer wants to record 50 new metrics but only 2 will qualify.
// By "qualify" we mean that metric is within the limit of metrics customer can register

@Injectable()
export class MetricRegisterQualificationService {
  constructor(
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly logger: Logger,
  ) {}

  public async qualifyMetrics(dtos: QualifyMetricDto[]): Promise<QualifyMetricDto[]> {
    const metricsSplitByProject = groupBy(dtos, 'projectId');

    const qualifiedMetricsAlreadyRegistered: QualifyMetricDto[] = [];
    const qualifiedMetricsToRegister: QualifyMetricDto[] = [];
    const notQualifiedMetrics: QualifyMetricDto[] = [];

    const qualificationResults = await Promise.all(
      Object.entries(metricsSplitByProject).map(async ([projectId, sameProjectDtos]) => {
        const result = await this.qualifyMetricsForProject(
          projectId,
          sameProjectDtos.map((dto) => dto.metricName),
        );
        return {
          projectId,
          result,
        };
      }),
    );

    for (const { projectId, result } of qualificationResults) {
      qualifiedMetricsAlreadyRegistered.push(
        ...result.alreadyRegistered.map((metricName) => ({
          metricName,
          projectId,
        })),
      );

      qualifiedMetricsToRegister.push(
        ...result.canBeRegistered.map((metricName) => ({
          metricName,
          projectId,
        })),
      );

      notQualifiedMetrics.push(
        ...result.cantBeRegistered.map((metricName) => ({
          metricName,
          projectId,
        })),
      );
    }

    if (notQualifiedMetrics.length) {
      this.logger.warn('Some metrics did not qualify during registration', {
        metrics: notQualifiedMetrics,
        count: notQualifiedMetrics.length,
      });
    }

    await this.metricRegisterWriteService.createMany(
      qualifiedMetricsToRegister.map((dto) => ({
        name: dto.metricName,
        projectId: dto.projectId,
      })),
    );

    return [...qualifiedMetricsAlreadyRegistered, ...qualifiedMetricsToRegister];
  }

  private async qualifyMetricsForProject(
    projectId: string,
    metricNamesCandidates: string[],
  ): Promise<{
    alreadyRegistered: string[];
    canBeRegistered: string[];
    cantBeRegistered: string[];
  }> {
    const registeredMetricNamesSet = new Set(
      await this.metricRegisterReadService.readRegisteredMetricNames(projectId),
    );

    const tier = await this.projectReadCachedService.readTier(projectId);

    const allowedNumberOfMetrics = getProjectPlanConfig(tier).metrics.maxMetricsRegisterEntries;

    const notRegisteredMetricNames: string[] = metricNamesCandidates.filter(
      (candidate) => !registeredMetricNamesSet.has(candidate),
    );

    if (!notRegisteredMetricNames.length) {
      return {
        alreadyRegistered: [...registeredMetricNamesSet],
        canBeRegistered: [],
        cantBeRegistered: [],
      };
    }

    const numberOfFreeSpots = allowedNumberOfMetrics - registeredMetricNamesSet.size;

    if (numberOfFreeSpots >= notRegisteredMetricNames.length) {
      return {
        alreadyRegistered: [...registeredMetricNamesSet],
        canBeRegistered: notRegisteredMetricNames,
        cantBeRegistered: [],
      };
    }

    const metricsWhichCanBeRegistered = notRegisteredMetricNames.slice(0, numberOfFreeSpots);

    const metricsWhichCantBeRegistered = notRegisteredMetricNames.slice(
      numberOfFreeSpots,
      notRegisteredMetricNames.length,
    );

    return {
      alreadyRegistered: [...registeredMetricNamesSet],
      canBeRegistered: metricsWhichCanBeRegistered,
      cantBeRegistered: metricsWhichCantBeRegistered,
    };
  }
}
