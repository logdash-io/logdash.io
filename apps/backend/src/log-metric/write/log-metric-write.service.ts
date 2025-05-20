import { Injectable } from '@nestjs/common';
import { UpsertLogMetricDto as UpsertLogMetricDto } from './dto/upsert-log-metric.dto';
import { LogMetricEntity } from '../core/entities/log-metric.entity';
import { FilterQuery, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RemoveLogMetricsDto } from './dto/remove-log-metrics.dto';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { MetricBucketingService } from '../../metric-shared/bucketing/metric-bucketing.service';

@Injectable()
export class LogMetricWriteService {
  constructor(
    @InjectModel(LogMetricEntity.name) private model: Model<LogMetricEntity>,
  ) {}

  public async upsertMany(dtos: UpsertLogMetricDto[]): Promise<void> {
    await this.model.bulkWrite(
      dtos.map((dto) => {
        const valuesToUpdate = Object.entries(dto.values).reduce(
          (acc, [key, value]) => {
            acc[`values.${key}`] = value;
            return acc;
          },
          {},
        );

        return {
          updateOne: {
            filter: { timeBucket: dto.timeBucket, projectId: dto.projectId },
            update: {
              $inc: valuesToUpdate,
              $setOnInsert: {
                _id: new Types.ObjectId(),
                granularity: dto.granularity,
                projectId: dto.projectId,
              },
            },
            upsert: true,
          },
        };
      }),
      { ordered: false },
    );
  }

  public async remove(dto: RemoveLogMetricsDto): Promise<void> {
    let dateBucket: string;

    if (dto.granularity === MetricGranularity.Minute) {
      dateBucket = MetricBucketingService.getMinuteBucket(dto.olderThan);
    } else if (dto.granularity === MetricGranularity.Hour) {
      dateBucket = MetricBucketingService.getHourBucket(dto.olderThan);
    } else if (dto.granularity === MetricGranularity.Day) {
      dateBucket = MetricBucketingService.getDayBucket(dto.olderThan);
    } else {
      throw Error('Unsupported granularity');
    }

    await this.model.deleteMany(
      {
        timeBucket: { $lt: dateBucket },
        granularity: dto.granularity,
        projectId: dto.projectId,
      },
      { ordered: false },
    );
  }

  public async removeMany(dtos: RemoveLogMetricsDto[]): Promise<void> {
    const query: FilterQuery<LogMetricEntity> = {
      $or: [],
    };

    dtos.map((dto) => {
      let dateBucket: string;

      if (dto.granularity === MetricGranularity.Minute) {
        dateBucket = MetricBucketingService.getMinuteBucket(dto.olderThan);
      } else if (dto.granularity === MetricGranularity.Hour) {
        dateBucket = MetricBucketingService.getHourBucket(dto.olderThan);
      } else if (dto.granularity === MetricGranularity.Day) {
        dateBucket = MetricBucketingService.getDayBucket(dto.olderThan);
      } else {
        throw Error('Unsupported granularity');
      }

      query.$or!.push({
        timeBucket: { $lt: dateBucket },
        granularity: dto.granularity,
        projectId: dto.projectId,
      });
    });

    await this.model.deleteMany(query, { ordered: false });
  }

  public async deleteBelongingToProject(projectId: string): Promise<void> {
    await this.model.deleteMany({ projectId });
  }
}
