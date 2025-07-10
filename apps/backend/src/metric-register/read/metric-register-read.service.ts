import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MetricRegisterEntryEntity } from '../core/entities/metric-register-entry.entity';
import { Model } from 'mongoose';
import { ProjectIdMetricNamePairDto } from './dto/project-id-name-pair.dto';
import { MetricRegisterEntryNormalized } from '../core/entities/metric-register-entry.normalized';
import { MetricRegisterEntrySerializer } from '../core/entities/metric-register-entry.serializer';

@Injectable()
export class MetricRegisterReadService {
  constructor(
    @InjectModel(MetricRegisterEntryEntity.name)
    private readonly model: Model<MetricRegisterEntryEntity>,
  ) {}

  public async existsForProject(projectId: string): Promise<boolean> {
    const result = await this.model.exists({ projectId });
    return result !== null;
  }

  public async readRegisteredMetricNames(projectId: string): Promise<string[]> {
    const entries = await this.model.find({ projectId }).exec();

    return entries.map((entry) => entry.name);
  }

  public async readById(id: string): Promise<MetricRegisterEntryNormalized | null> {
    const result = await this.model.findById(id).exec();

    if (!result) {
      return null;
    }

    return MetricRegisterEntrySerializer.normalize(result);
  }

  // this method accepts data as array of objects with projectId and metricName
  // and returns object with ${projectId}-${metricName} as key and id as value
  public async readIdsFromProjectIdMetricNamePairs(
    dtos: ProjectIdMetricNamePairDto[],
  ): Promise<Record<string, string>> {
    const entries = await this.model
      .find({
        $or: dtos.map((dto) => ({
          name: dto.metricName,
          projectId: dto.projectId,
        })),
      })
      .lean<MetricRegisterEntryEntity[]>()
      .exec();

    const result: Record<string, string> = {};

    for (const entry of entries) {
      result[`${entry.projectId}-${entry.name}`] = entry._id.toString();
    }

    return result;
  }

  public async readIdsAndValuesFromProjectIdMetricNamePairs(
    dtos: ProjectIdMetricNamePairDto[],
  ): Promise<Record<string, { id: string; value: number }>> {
    const entries = await this.model
      .find({
        $or: dtos.map((dto) => ({
          name: dto.metricName,
          projectId: dto.projectId,
        })),
      })
      .lean<MetricRegisterEntryEntity[]>()
      .exec();

    const result: Record<string, { id: string; value: number }> = {};

    for (const entry of entries) {
      result[`${entry.projectId}-${entry.name}`] = {
        id: entry._id.toString(),
        value: entry.values?.counter?.absoluteValue ?? 0,
      };
    }

    return result;
  }

  public async readBelongingToProject(projectId: string): Promise<MetricRegisterEntryNormalized[]> {
    const entities = await this.model
      .find({ projectId })
      .lean<MetricRegisterEntryEntity[]>()
      .exec();

    return entities.map((entity) => MetricRegisterEntrySerializer.normalize(entity));
  }

  public async readMetricRegisterEntriesToRecord(): Promise<
    { metricRegisterEntryId: string; value: number }[]
  > {
    const entries = await this.model
      .find({}, { _id: 1, values: 1 })
      .lean<MetricRegisterEntryEntity[]>()
      .exec();

    return entries.map((entry) => ({
      metricRegisterEntryId: entry._id.toString(),
      value: entry.values?.counter?.absoluteValue ?? 0,
    }));
  }
}
