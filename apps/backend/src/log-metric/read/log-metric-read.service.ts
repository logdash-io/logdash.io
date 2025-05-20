import { Injectable } from '@nestjs/common';
import { LogMetricNormalized } from '../core/entities/log-metric.interface';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { LogMetricEntity } from '../core/entities/log-metric.entity';
import { LogMetricSerializer } from '../core/entities/log-metric.serializer';
import { MetricBucketingService } from '../../metric-shared/bucketing/metric-bucketing.service';

@Injectable()
export class LogMetricReadService {
  constructor(
    @InjectModel(LogMetricEntity.name) private model: Model<LogMetricEntity>,
  ) {}

  public async read(params: {
    granularities?: MetricGranularity[];
    before?: Date;
    after?: Date;
    projectId: string;
  }): Promise<LogMetricNormalized[]> {
    const findQuery: FilterQuery<LogMetricEntity> = {
      ...this.constructGranularitiesQuery(params),
    };

    findQuery.projectId = params.projectId;

    const logMetrics = await this.model
      .find(findQuery)
      .lean<LogMetricEntity[]>()
      .exec();

    return logMetrics.map((metric) => LogMetricSerializer.normalize(metric));
  }

  private constructGranularitiesQuery(params: {
    granularities?: MetricGranularity[];
    before?: Date;
    after?: Date;
  }): FilterQuery<LogMetricEntity> {
    const filter: FilterQuery<LogMetricEntity> = { $or: [] };

    const granularities = params.granularities || [
      MetricGranularity.Minute,
      MetricGranularity.Hour,
      MetricGranularity.Day,
    ];

    for (const granularity of granularities) {
      filter.$or!.push(
        this.constructFindQueryForGranularity({
          before: params.before,
          after: params.after,
          granularity,
        }),
      );
    }

    return filter;
  }

  private constructFindQueryForGranularity(params: {
    before?: Date;
    after?: Date;
    granularity: MetricGranularity;
  }): FilterQuery<LogMetricEntity> {
    const findQuery: FilterQuery<LogMetricEntity> = {
      $and: [{ granularity: params.granularity }],
    };

    if (params.before && params.after) {
      findQuery.$and?.push({
        timeBucket: {
          $gte: MetricBucketingService.getBucket(
            params.after,
            params.granularity,
          ),
          $lte: MetricBucketingService.getBucket(
            params.before,
            params.granularity,
          ),
        },
      });
    } else if (params.before) {
      findQuery.timeBucket = {
        $lte: MetricBucketingService.getBucket(
          params.before,
          params.granularity,
        ),
      };
    } else if (params.after) {
      findQuery.timeBucket = {
        $gte: MetricBucketingService.getBucket(
          params.after,
          params.granularity,
        ),
      };
    }

    return findQuery;
  }
}
