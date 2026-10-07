import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { CreateHttpMonitorBody } from '../../src/http-monitor/core/dto/create-http-monitor.body';
import { HttpMonitorEntity } from '../../src/http-monitor/core/entities/http-monitor.entity';
import {
  HttpMonitorNormalized,
  HttpMonitorSerialized,
} from '../../src/http-monitor/core/entities/http-monitor.interface';
import { HttpMonitorSerializer } from '../../src/http-monitor/core/entities/http-monitor.serializer';
import { HttpMonitorMode } from '../../src/http-monitor/core/enums/http-monitor-mode.enum';
import { ProjectEntity } from '../../src/project/core/entities/project.entity';
export const URL_STUB = 'https://example.com';

export class HttpMonitorUtils {
  private httpMonitorModel: Model<HttpMonitorEntity>;
  private projectModel: Model<ProjectEntity>;

  constructor(private readonly app: INestApplication<App>) {
    this.httpMonitorModel = this.app.get(getModelToken(HttpMonitorEntity.name));
    this.projectModel = this.app.get(getModelToken(ProjectEntity.name));
  }

  public async createClaimedHttpMonitor(
    dto: Partial<CreateHttpMonitorBody> & {
      token: string;
      clusterId?: string;
      projectId?: string;
    },
  ): Promise<HttpMonitorSerialized> {
    this.tryFillDto(dto);

    // The global ValidationPipe runs with `forbidNonWhitelisted`, so only the
    // properties declared on CreateHttpMonitorBody may go into the request body.
    // `token`, `clusterId` and `projectId` are transport details, not part of the payload.
    const body: CreateHttpMonitorBody = {
      name: dto.name!,
      url: dto.url,
      mode: dto.mode!,
      notificationChannelsIds: dto.notificationChannelsIds,
    };

    const response = await request(this.app.getHttpServer())
      .post(
        dto.clusterId
          ? `/clusters/${dto.clusterId}/http_monitors`
          : `/projects/${dto.projectId}/http_monitors`,
      )
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    if (response.status !== 201) {
      throw new Error(
        `Creating http monitor failed with ${response.status}: ${JSON.stringify(response.body)}`,
      );
    }

    const httpMonitor = response.body as HttpMonitorSerialized;

    // claim
    await request(this.app.getHttpServer())
      .post(`/http_monitors/${httpMonitor.id}/claim`)
      .set('Authorization', `Bearer ${dto.token}`);

    return httpMonitor;
  }

  public async storeHttpMonitor(
    dto: Partial<CreateHttpMonitorBody> & {
      token?: string;
      clusterId?: string;
      projectId?: string;
      claimed?: boolean;
    },
  ): Promise<HttpMonitorNormalized> {
    this.tryFillDto(dto);
    const clusterId = dto.clusterId ?? (await this.readClusterIdOfProject(dto.projectId!));
    const monitor = await this.httpMonitorModel.create({ ...dto, clusterId });
    return HttpMonitorSerializer.normalize(monitor);
  }

  private async readClusterIdOfProject(projectId: string): Promise<string> {
    const project = await this.projectModel.findById(projectId).lean<ProjectEntity>().exec();

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    return project.clusterId;
  }

  private tryFillDto(dto: Partial<CreateHttpMonitorBody>): CreateHttpMonitorBody {
    if (!dto.url) {
      dto.url = URL_STUB;
    }

    if (!dto.name) {
      dto.name = 'Example monitor';
    }

    if (!dto.mode) {
      dto.mode = HttpMonitorMode.Pull;
    }

    return dto as CreateHttpMonitorBody;
  }
}
