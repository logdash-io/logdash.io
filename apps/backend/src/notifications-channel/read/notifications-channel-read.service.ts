import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsChannelEntity } from '../core/entities/notifications-channel.entity';
import { NotificationsChannelNormalized } from '../core/entities/notifications-channel.interface';
import { NotificationsChannelSerializer } from '../core/entities/notifications-channel.serializer';

@Injectable()
export class NotificationsChannelReadService {
  constructor(
    @InjectModel(NotificationsChannelEntity.name)
    private notificationsChannelModel: Model<NotificationsChannelEntity>,
  ) {}

  public async readById(id: string): Promise<NotificationsChannelNormalized> {
    const notificationsChannel = await this.notificationsChannelModel
      .findById(id)
      .lean<NotificationsChannelEntity>()
      .exec();

    if (!notificationsChannel) {
      throw new Error(`Notifications channel with id: ${id} not found for read`);
    }

    return NotificationsChannelSerializer.normalize(notificationsChannel);
  }

  public async readByIds(ids: string[]): Promise<NotificationsChannelNormalized[]> {
    const notificationsChannels = await this.notificationsChannelModel
      .find({ _id: { $in: ids } })
      .lean<NotificationsChannelEntity[]>()
      .exec();

    return notificationsChannels.map(NotificationsChannelSerializer.normalize);
  }

  public async readByClusterId(clusterId: string): Promise<NotificationsChannelNormalized[]> {
    const notificationsChannels = await this.notificationsChannelModel
      .find({ clusterId })
      .lean<NotificationsChannelEntity[]>()
      .exec();

    return notificationsChannels.map(NotificationsChannelSerializer.normalize);
  }
}
