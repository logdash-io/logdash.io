import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateHttpMonitorBody } from '../core/dto/create-http-monitor.body';
import { HttpMonitorEntity } from '../core/entities/http-monitor.entity';
import { HttpMonitorNormalized } from '../core/entities/http-monitor.interface';
import { HttpMonitorSerializer } from '../core/entities/http-monitor.serializer';

@Injectable()
export class HttpMonitorWriteService {
  constructor(
    @InjectModel(HttpMonitorEntity.name)
    private readonly httpMonitorModel: Model<HttpMonitorEntity>,
  ) {}

  async create(
    clusterId: string,
    dto: CreateHttpMonitorBody,
  ): Promise<HttpMonitorNormalized> {
    const entity = await this.httpMonitorModel.create({
      clusterId,
      name: dto.name,
      url: dto.url,
    });

    return HttpMonitorSerializer.normalize(entity);
  }
} 