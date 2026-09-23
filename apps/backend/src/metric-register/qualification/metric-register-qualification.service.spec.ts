import { advanceBy, clear } from 'jest-date-mock';
import { ProjectTier } from '../../project/core/enums/project-tier.enum';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { MetricRegisterReadService } from '../read/metric-register-read.service';
import { MetricRegisterWriteService } from '../write/metric-register-write.service';
import { MetricRegisterQualificationService } from './metric-register-qualification.service';

describe('MetricRegisterQualificationService', () => {
  const overLimit = (projectId: string) =>
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((metricName) => ({ projectId, metricName }));

  let warn: jest.Mock;
  let service: MetricRegisterQualificationService;

  beforeEach(() => {
    warn = jest.fn();
    service = new MetricRegisterQualificationService(
      { readRegisteredMetricNames: async () => [] } as unknown as MetricRegisterReadService,
      {
        readProject: async () => ({ tier: ProjectTier.Free }),
      } as unknown as ProjectReadCachedService,
      { createMany: async () => undefined } as unknown as MetricRegisterWriteService,
      { warn } as unknown as LogdashLogger,
    );
  });

  afterEach(() => {
    clear();
  });

  it('warns about a project over its metric limit at most once an hour', async () => {
    // when
    await service.qualifyMetrics(overLimit('project-a'));
    await service.qualifyMetrics(overLimit('project-a'));
    advanceBy(59 * 60 * 1000);
    await service.qualifyMetrics(overLimit('project-a'));

    // then
    expect(warn).toHaveBeenCalledTimes(1);

    // when
    advanceBy(60 * 1000);
    await service.qualifyMetrics(overLimit('project-a'));

    // then
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('still warns about another project inside the same hour', async () => {
    // when
    await service.qualifyMetrics(overLimit('project-a'));
    await service.qualifyMetrics(overLimit('project-b'));

    // then
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][1].metrics.every((dto) => dto.projectId === 'project-b')).toBe(true);
  });
});
