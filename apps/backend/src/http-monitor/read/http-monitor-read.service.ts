import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpMonitorEntity } from '../core/entities/http-monitor.entity';
import { HttpMonitorNormalized } from '../core/entities/http-monitor.interface';
import { HttpMonitorSerializer } from '../core/entities/http-monitor.serializer';

@Injectable()
export class HttpMonitorReadService {
  constructor(
    @InjectModel(HttpMonitorEntity.name)
    private readonly httpMonitorModel: Model<HttpMonitorEntity>,
  ) {}

  async readById(id: string): Promise<HttpMonitorNormalized | null> {
    const entity = await this.httpMonitorModel.findById(id).lean<HttpMonitorEntity>().exec();

    if (!entity) {
      return null;
    }

    return HttpMonitorSerializer.normalize(entity);
  }

  async readByClusterId(clusterId: string): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ clusterId })
      .sort({ createdAt: -1 })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }

  async countBelongingToCluster(clusterId: string): Promise<number> {
    return this.httpMonitorModel.countDocuments({ clusterId }).lean().exec();
  }

  async countAll(): Promise<number> {
    return this.httpMonitorModel.countDocuments().lean().exec();
  }

  async *readAllCursor(): AsyncGenerator<HttpMonitorNormalized> {
    const cursor = this.httpMonitorModel.find().sort({ createdAt: -1 }).cursor();

    for await (const entity of cursor) {
      yield HttpMonitorSerializer.normalize(entity);
    }
  }
}
