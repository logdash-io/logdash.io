import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { CreateHttpMonitorBody } from '../core/dto/create-http-monitor.body';
import { HttpMonitorEntity } from '../core/entities/http-monitor.entity';
import { HttpMonitorNormalized } from '../core/entities/http-monitor.interface';
import { HttpMonitorSerializer } from '../core/entities/http-monitor.serializer';
import { UpdateHttpMonitorBody } from '../core/dto/update-http-monitor.body';

@Injectable()
export class HttpMonitorWriteService {
  constructor(
    @InjectModel(HttpMonitorEntity.name)
    private readonly httpMonitorModel: Model<HttpMonitorEntity>,
  ) {}

  async create(projectId: string, dto: CreateHttpMonitorBody): Promise<HttpMonitorNormalized> {
    const entity = await this.httpMonitorModel.create({
      projectId,
      name: dto.name,
      url: dto.url,
      notificationsChannelsIds: dto.notificationsChannelsIds,
    });

    return HttpMonitorSerializer.normalize(entity);
  }

  public async deleteByProjectId(projectId: string): Promise<void> {
    await this.httpMonitorModel.deleteMany({ projectId });
  }

  public async update(
    httpMonitorId: string,
    dto: UpdateHttpMonitorBody,
  ): Promise<HttpMonitorNormalized> {
    const updateQuery: UpdateQuery<HttpMonitorEntity> = {};
    if (dto.name) {
      updateQuery.name = dto.name;
    }
    if (dto.url) {
      updateQuery.url = dto.url;
    }

    if (dto.notificationsChannelsIds) {
      updateQuery.notificationsChannelsIds = dto.notificationsChannelsIds;
    }

    const entity = await this.httpMonitorModel.findByIdAndUpdate(httpMonitorId, updateQuery, {
      new: true,
    });

    if (!entity) {
      throw new NotFoundException('Http monitor not found');
    }

    return HttpMonitorSerializer.normalize(entity);
  }
}
