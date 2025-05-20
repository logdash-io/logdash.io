import { LogMetricAggregationService } from './log-metric-aggregation-service';
import { Types } from 'mongoose';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { UpsertLogMetricDto } from '../write/dto/upsert-log-metric.dto';

describe('LogMetricAggregationService', () => {
  const service = new LogMetricAggregationService();

  it('aggregates dtos', () => {
    const timeBucketA = '2021-01-01T00:00';
    const timeBucketB = '2021-01-01T10:00';

    const dtos: UpsertLogMetricDto[] = [
      // same project, same time bucket
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketA,
        values: {
          error: 1,
        },
        projectId: 'A',
      },
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketA,
        values: {
          info: 2,
        },
        projectId: 'A',
      },
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketA,
        values: {
          warning: 3,
        },
        projectId: 'A',
      },
      // different project, same time bucket
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketA,
        values: {
          error: 1,
        },
        projectId: 'B',
      },
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketA,
        values: {
          info: 2,
        },
        projectId: 'B',
      },
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketA,
        values: {
          warning: 3,
        },
        projectId: 'B',
      },
      // different time bucket, same old project
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketB,
        values: {
          error: 1,
        },
        projectId: 'A',
      },
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketB,
        values: {
          info: 2,
        },
        projectId: 'A',
      },
      {
        granularity: MetricGranularity.Minute,
        timeBucket: timeBucketB,
        values: {
          warning: 3,
        },
        projectId: 'A',
      },
      // different granularity
      {
        granularity: MetricGranularity.AllTime,
        timeBucket: timeBucketB,
        values: {
          error: 1,
        },
        projectId: 'A',
      },
      {
        granularity: MetricGranularity.AllTime,
        timeBucket: timeBucketB,
        values: {
          info: 2,
        },
        projectId: 'A',
      },
      {
        granularity: MetricGranularity.AllTime,
        timeBucket: timeBucketB,
        values: {
          warning: 3,
        },
        projectId: 'A',
      },
    ];

    const result = service.aggregate(dtos);

    expect(result).toEqual(
      expect.arrayContaining([
        {
          granularity: MetricGranularity.Minute,
          timeBucket: timeBucketA,
          values: { error: 1, info: 2, warning: 3 },
          projectId: 'A',
        },
        {
          granularity: MetricGranularity.Minute,
          timeBucket: timeBucketB,
          values: { error: 1, info: 2, warning: 3 },
          projectId: 'A',
        },
        {
          granularity: MetricGranularity.AllTime,
          timeBucket: timeBucketB,
          values: { error: 1, info: 2, warning: 3 },
          projectId: 'A',
        },
        {
          granularity: MetricGranularity.Minute,
          timeBucket: timeBucketA,
          values: { error: 1, info: 2, warning: 3 },
          projectId: 'B',
        },
      ]),
    );
  });
});
