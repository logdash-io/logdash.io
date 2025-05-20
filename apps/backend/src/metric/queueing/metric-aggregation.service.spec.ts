import { MetricAggregationService } from './metric-aggregation.service';
import { RecordMetricDto } from '../ingestion/dto/record-metric.dto';
import { MetricOperation } from '../core/enums/metric-operation.enum';

describe('MetricAggregationService', () => {
  let service: MetricAggregationService;

  beforeEach(() => {
    service = new MetricAggregationService();
  });

  it('saves a new metric', () => {
    const dto: RecordMetricDto = {
      name: 'test-metric',
      projectId: 'project-1',
      value: 5,
      operation: MetricOperation.Change,
    };

    service.save(dto);
    const metrics = service.getAndClear();

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toEqual(dto);
  });

  it('overrides existing metric when operation is Set', () => {
    const firstDto: RecordMetricDto = {
      name: 'test-metric',
      projectId: 'project-1',
      value: 5,
      operation: MetricOperation.Change,
    };

    const secondDto: RecordMetricDto = {
      name: 'test-metric',
      projectId: 'project-1',
      value: 10,
      operation: MetricOperation.Set,
    };

    service.save(firstDto);
    service.save(secondDto);
    const metrics = service.getAndClear();

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toEqual(secondDto);
  });

  it('adds values when saving the same metric with Change operation', () => {
    const firstDto: RecordMetricDto = {
      name: 'test-metric',
      projectId: 'project-1',
      value: 5,
      operation: MetricOperation.Change,
    };

    const secondDto: RecordMetricDto = {
      name: 'test-metric',
      projectId: 'project-1',
      value: 10,
      operation: MetricOperation.Change,
    };

    service.save(firstDto);
    service.save(secondDto);
    const metrics = service.getAndClear();

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toEqual({
      name: 'test-metric',
      projectId: 'project-1',
      value: 15,
      operation: MetricOperation.Change,
    });
  });

  it('maintains separate metrics for different names or projects', () => {
    const metrics = [
      {
        name: 'metric-1',
        projectId: 'project-1',
        value: 5,
        operation: MetricOperation.Change,
      },
      {
        name: 'metric-2',
        projectId: 'project-1',
        value: 10,
        operation: MetricOperation.Change,
      },
      {
        name: 'metric-1',
        projectId: 'project-2',
        value: 15,
        operation: MetricOperation.Change,
      },
    ];

    metrics.forEach((metric) => service.save(metric));
    const result = service.getAndClear();

    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining(metrics));
  });

  it('returns empty array after clearing', () => {
    const dto: RecordMetricDto = {
      name: 'test-metric',
      projectId: 'project-1',
      value: 5,
      operation: MetricOperation.Change,
    };

    service.save(dto);
    service.getAndClear();
    const metrics = service.getAndClear();

    expect(metrics).toHaveLength(0);
  });
});
