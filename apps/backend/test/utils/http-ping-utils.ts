import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpPingEntity } from '../../src/http-ping/core/entities/http-ping.entity';
import { HttpPingNormalized } from '../../src/http-ping/core/entities/http-ping.interface';
import { HttpPingSerializer } from '../../src/http-ping/core/entities/http-ping.serializer';

export class HttpPingUtils {
  private httpPingModel: Model<HttpPingEntity>;

  constructor(private readonly app: INestApplication<any>) {
    this.httpPingModel = this.app.get(getModelToken(HttpPingEntity.name));
  }

  public async createHttpPing(params: {
    httpMonitorId: string;
    statusCode?: number;
    responseTimeMs?: number;
    message?: string;
  }): Promise<HttpPingNormalized> {
    const httpPing = await this.httpPingModel.create({
      httpMonitorId: params.httpMonitorId,
      statusCode: params.statusCode ?? 200,
      responseTimeMs: params.responseTimeMs ?? 100,
      message: params.message ?? 'Default HTTP ping',
    });

    return HttpPingSerializer.normalize(httpPing);
  }

  public async getMonitorPings(params: { httpMonitorId: string }): Promise<HttpPingNormalized[]> {
    const pings = await this.httpPingModel.find({ httpMonitorId: params.httpMonitorId });
    return HttpPingSerializer.normalizeMany(pings);
  }

  public async getAllPings(): Promise<HttpPingNormalized[]> {
    const pings = await this.httpPingModel.find();
    return HttpPingSerializer.normalizeMany(pings);
  }
}
