import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MetricRegisterEntryEntity } from '../core/entities/metric-register-entry.entity';
import { CreateMetricRegisterEntryDto } from './dto/create-metric-register-entry.dto';
import { RemoveMetricRegisterEntryDto } from './dto/remove-metric-register-entry.dto';

@Injectable()
export class MetricRegisterWriteService {
  constructor(
    @InjectModel(MetricRegisterEntryEntity.name)
    private readonly model: Model<MetricRegisterEntryEntity>,
  ) {}

  public async createMany(dtos: CreateMetricRegisterEntryDto[]): Promise<void> {
    await this.model.insertMany(dtos, { ordered: false });
  }

  public async deleteBelongingToProject(projectId: string): Promise<void> {
    await this.model.deleteMany({ projectId }, { ordered: false });
  }

  public async removeById(
    dto: RemoveMetricRegisterEntryDto,
  ): Promise<string | null> {
    const entry = await this.model.findOne({
      _id: new Types.ObjectId(dto.id),
    });

    if (!entry) {
      return null;
    }

    const entryId = entry._id.toString();
    await this.model.deleteOne({ _id: entry._id });

    return entryId;
  }
}
