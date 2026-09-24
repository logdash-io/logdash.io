import { Inject, Injectable } from '@nestjs/common';
import { MetricRegisterReadService } from '../read/metric-register-read.service';
import { QualifyMetricDto } from './dto/qualify-metric.dto';
import { groupBy } from '../../shared/utils/group-by';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { MetricRegisterWriteService } from '../write/metric-register-write.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { METRIC_REGISTER_LOGGER } from '../../shared/logdash/logdash-tokens';

// When customer wants to add metric, he may hit a limit of registered metrics
// as the registration process is automatic. This service is needed as the first
// step when customer requests to ingest a new metric. It will check all metrics
// customer wants to record and then return list of metrics which qualify. It may
// happen that customer wants to record 50 new metrics but only 2 will qualify.
// By "qualify" we mean that metric is within the limit of metrics customer can register

// A project at its limit keeps sending the same metrics on every flush, so the
// warning would repeat several times a minute. Once an hour per project says it.
const NOT_QUALIFIED_WARNING_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class MetricRegisterQualificationService {
  private readonly lastNotQualifiedWarningAt = new Map<string, number>();

  constructor(
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    @Inject(METRIC_REGISTER_LOGGER) private readonly logger: LogdashLogger,
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

    this.warnAboutNotQualifiedMetrics(notQualifiedMetrics);

    await this.metricRegisterWriteService.createMany(
      qualifiedMetricsToRegister.map((dto) => ({
        name: dto.metricName,
        projectId: dto.projectId,
      })),
    );

    return [...qualifiedMetricsAlreadyRegistered, ...qualifiedMetricsToRegister];
  }

  private warnAboutNotQualifiedMetrics(notQualifiedMetrics: QualifyMetricDto[]): void {
    const now = Date.now();

    const metrics = notQualifiedMetrics.filter(
      (dto) =>
        now - (this.lastNotQualifiedWarningAt.get(dto.projectId) ?? 0) >=
        NOT_QUALIFIED_WARNING_INTERVAL_MS,
    );

    if (!metrics.length) {
      return;
    }

    for (const dto of metrics) {
      this.lastNotQualifiedWarningAt.set(dto.projectId, now);
    }

    this.logger.warn('Some metrics did not qualify during registration', {
      metrics,
      count: metrics.length,
    });
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

    const project = await this.projectReadCachedService.readProject(projectId);

    if (!project) {
      return {
        alreadyRegistered: [],
        canBeRegistered: [],
        cantBeRegistered: metricNamesCandidates,
      };
    }

    const tier = project.tier;

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
