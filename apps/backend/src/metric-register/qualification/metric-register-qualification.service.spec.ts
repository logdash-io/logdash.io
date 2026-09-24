import { Test } from '@nestjs/testing';
import { advanceBy, clear } from 'jest-date-mock';
import { ProjectTier } from '../../project/core/enums/project-tier.enum';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { METRIC_REGISTER_LOGGER } from '../../shared/logdash/logdash-tokens';
import { MetricRegisterReadService } from '../read/metric-register-read.service';
import { MetricRegisterWriteService } from '../write/metric-register-write.service';
import { QualifyMetricDto } from './dto/qualify-metric.dto';
import { MetricRegisterQualificationService } from './metric-register-qualification.service';

type WarnArgs = [message: string, context: { metrics: QualifyMetricDto[]; count: number }];

describe('MetricRegisterQualificationService', () => {
  const overLimit = (projectId: string): QualifyMetricDto[] =>
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((metricName) => ({ projectId, metricName }));

  let warn: jest.Mock<void, WarnArgs>;
  let service: MetricRegisterQualificationService;

  beforeEach(async () => {
    warn = jest.fn<void, WarnArgs>();

    const moduleRef = await Test.createTestingModule({
      providers: [
        MetricRegisterQualificationService,
        {
          provide: MetricRegisterReadService,
          useValue: { readRegisteredMetricNames: () => Promise.resolve([]) },
        },
        {
          provide: ProjectReadCachedService,
          useValue: { readProject: () => Promise.resolve({ tier: ProjectTier.Free }) },
        },
        {
          provide: MetricRegisterWriteService,
          useValue: { createMany: () => Promise.resolve() },
        },
        { provide: METRIC_REGISTER_LOGGER, useValue: { warn } },
      ],
    }).compile();

    service = moduleRef.get(MetricRegisterQualificationService);
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
