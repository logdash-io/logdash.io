import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PublicDashboardDocument,
  PublicDashboardEntity,
} from '../core/entities/public-dashboard.entity';
import { CreatePublicDashboardDto } from './dto/create-public-dashboard.dto';
import { PublicDashboardSerializer } from '../core/entities/public-dashboard.serializer';
import { PublicDashboardNormalized } from '../core/entities/public-dashboard.interface';
import { AddMonitorToDashboardDto } from './dto/add-monitor-to-dashboard.dto';
import { RemoveMonitorFromDashboardDto } from './dto/remove-monitor-from-dashboard.dto';

@Injectable()
export class PublicDashboardWriteService {
  constructor(
    @InjectModel(PublicDashboardEntity.name)
    private readonly publicDashboardModel: Model<PublicDashboardDocument>,
  ) {}

  public async create(dto: CreatePublicDashboardDto): Promise<PublicDashboardNormalized> {
    const entity = new this.publicDashboardModel({
      clusterId: dto.clusterId,
      httpMonitorsIds: dto.httpMonitorsIds || [],
    });

    const saved = await entity.save();
    return PublicDashboardSerializer.normalize(saved);
  }

  public async addMonitorToDashboard(dto: AddMonitorToDashboardDto): Promise<void> {
    await this.publicDashboardModel.updateOne(
      { _id: dto.publicDashboardId },
      { $addToSet: { httpMonitorsIds: dto.httpMonitorId } },
    );
  }

  public async removeMonitorFromDashboard(dto: RemoveMonitorFromDashboardDto): Promise<void> {
    await this.publicDashboardModel.updateOne(
      { _id: dto.publicDashboardId },
      { $pull: { httpMonitorsIds: dto.httpMonitorId } },
    );
  }

  public async deleteByClusterId(clusterId: string): Promise<void> {
    await this.publicDashboardModel.deleteMany({ clusterId });
  }
}
