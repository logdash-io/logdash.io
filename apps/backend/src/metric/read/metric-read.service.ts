import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetricEntity } from '../core/entities/metric.entity';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { MetricNormalized } from '../core/entities/metric.normalized';
import { MetricSerializer } from '../core/entities/metric.serializer';
import { ReadBaselineValuesDto } from './dto/read-baseline-values.dto';

@Injectable()
export class MetricReadService {
  constructor(@InjectModel(MetricEntity.name) private model: Model<MetricEntity>) {}

  public async readByProjectId(projectId: string): Promise<MetricNormalized[]> {
    const metrics = await this.model
      .find({
        projectId: projectId,
      })
      .lean<MetricEntity[]>()
      .exec();

    return metrics.map((metric) => MetricSerializer.normalize(metric));
  }

  public async readByMetricRegisterEntryId(
    metricRegisterEntryId: string,
  ): Promise<MetricNormalized[]> {
    const metrics = await this.model
      .find({
        metricRegisterEntryId: metricRegisterEntryId,
      })
      .lean<MetricEntity[]>()
      .exec();

    return metrics.map((metric) => MetricSerializer.normalize(metric));
  }

  public async readBaselineValues(dto: ReadBaselineValuesDto): Promise<Record<string, number>> {
    const metrics = await this.model
      .find({
        metricRegisterEntryId: { $in: dto.metricRegisterEntryIds },
        granularity: MetricGranularity.AllTime,
      })
      .lean<MetricEntity[]>()
      .exec();

    const result: Record<string, number> = {};

    for (const metric of metrics) {
      result[metric.metricRegisterEntryId] = metric.value;
    }

    return result;
  }
}
