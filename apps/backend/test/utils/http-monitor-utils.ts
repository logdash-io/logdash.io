import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as request from 'supertest';
import { CreateHttpMonitorBody } from '../../src/http-monitor/core/dto/create-http-monitor.body';
import { HttpMonitorEntity } from '../../src/http-monitor/core/entities/http-monitor.entity';
import {
  HttpMonitorNormalized,
  HttpMonitorSerialized,
} from '../../src/http-monitor/core/entities/http-monitor.interface';
import { HttpMonitorSerializer } from '../../src/http-monitor/core/entities/http-monitor.serializer';
export const URL_STUB = 'https://example.com';

export class HttpMonitorUtils {
  private httpMonitorModel: Model<HttpMonitorEntity>;

  constructor(private readonly app: INestApplication<any>) {
    this.httpMonitorModel = this.app.get(getModelToken(HttpMonitorEntity.name));
  }

  public async createHttpMonitor(
    dto: Partial<CreateHttpMonitorBody> & { token: string; projectId: string },
  ): Promise<HttpMonitorSerialized> {
    this.tryFillDto(dto);

    const response = await request(this.app.getHttpServer())
      .post(`/projects/${dto.projectId}/http_monitors`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(dto);

    return response.body;
  }

  public async storeHttpMonitor(
    dto: Partial<CreateHttpMonitorBody> & { token: string; projectId: string },
  ): Promise<HttpMonitorNormalized> {
    this.tryFillDto(dto);
    const monitor = await this.httpMonitorModel.create(dto);
    return HttpMonitorSerializer.normalize(monitor);
  }

  private tryFillDto(dto: Partial<CreateHttpMonitorBody>): CreateHttpMonitorBody {
    if (!dto.url) {
      dto.url = URL_STUB;
    }

    if (!dto.name) {
      dto.name = 'Example monitor';
    }

    return dto as CreateHttpMonitorBody;
  }
}
