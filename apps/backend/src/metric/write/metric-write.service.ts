import { Injectable } from '@nestjs/common';
import { MetricEntity } from '../core/entities/metric.entity';
import { QueryFilter, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpsertMetricDto } from './dto/upsert-metric.dto';
import { RemoveMetricsDto } from './dto/remove-metrics.dto';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { MetricBucketingService } from '../../metric-shared/bucketing/metric-bucketing.service';

@Injectable()
export class MetricWriteService {
  constructor(@InjectModel(MetricEntity.name) private model: Model<MetricEntity>) {}

  public async upsertMany(dtos: UpsertMetricDto[]): Promise<void> {
    await this.model.bulkWrite(
      dtos.map((dto) => {
        return {
          updateOne: {
            filter: {
              timeBucket: dto.timeBucket,
              metricRegisterEntryId: dto.metricRegisterEntryId,
            },
            update: {
              $set: {
                value: dto.value,
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

  public async removeMany(dtos: RemoveMetricsDto[]): Promise<void> {
    const query: QueryFilter<MetricEntity> = {
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
    await this.model.deleteMany({ projectId }, { ordered: false });
  }

  public async deleteByMetricRegisterEntryId(metricRegisterEntryId: string): Promise<void> {
    await this.model.deleteMany({ metricRegisterEntryId }, { ordered: false });
  }
}
