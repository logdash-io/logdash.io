import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpPingEntity } from '../core/entities/http-ping.entity';
import { HttpPingNormalized } from '../core/entities/http-ping.interface';
import { HttpPingSerializer } from '../core/entities/http-ping.serializer';
import { CreateHttpPingDto } from './dto/create-http-ping.dto';

@Injectable()
export class HttpPingWriteService {
  constructor(
    @InjectModel(HttpPingEntity.name)
    private model: Model<HttpPingEntity>,
  ) {}

  public async createMany(dtos: CreateHttpPingDto[]): Promise<HttpPingNormalized[]> {
    if (dtos.length === 0) return [];

    const entities = await this.model.insertMany(
      dtos.map((dto) => ({
        httpMonitorId: dto.httpMonitorId,
        statusCode: dto.statusCode,
        responseTimeMs: dto.responseTimeMs,
        message: dto.message,
      })),
      { ordered: false },
    );

    return HttpPingSerializer.normalizeMany(entities);
  }

  public async deleteOlderThan(date: Date): Promise<void> {
    await this.model.deleteMany({ createdAt: { $lt: date } });
  }

  public async deleteByMonitorIds(monitorIds: string[]): Promise<void> {
    await this.model.deleteMany({ httpMonitorId: { $in: monitorIds } });
  }
}
