import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpPingEntity } from '../core/entities/http-ping.entity';
import { HttpPingNormalized } from '../core/entities/http-ping.interface';
import { HttpPingSerializer } from '../core/entities/http-ping.serializer';

@Injectable()
export class HttpPingReadService {
  constructor(
    @InjectModel(HttpPingEntity.name)
    private model: Model<HttpPingEntity>,
  ) {}

  public async readByMonitorId(monitorId: string): Promise<HttpPingNormalized[]> {
    const entities = await this.model
      .find({ httpMonitorId: monitorId })
      .sort({ createdAt: -1 })
      .exec();

    return HttpPingSerializer.normalizeMany(entities);
  }
}
