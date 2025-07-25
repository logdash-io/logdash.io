import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationChannelEntity } from '../core/entities/notification-channel.entity';
import { NotificationChannelNormalized } from '../core/entities/notification-channel.interface';
import { NotificationChannelSerializer } from '../core/entities/notification-channel.serializer';

@Injectable()
export class NotificationChannelReadService {
  constructor(
    @InjectModel(NotificationChannelEntity.name)
    private notificationChannelModel: Model<NotificationChannelEntity>,
  ) {}

  public async readById(id: string): Promise<NotificationChannelNormalized> {
    const notificationChannel = await this.notificationChannelModel
      .findById(id)
      .lean<NotificationChannelEntity>()
      .exec();

    if (!notificationChannel) {
      throw new Error(`Notification channel with id: ${id} not found for read`);
    }

    return NotificationChannelSerializer.normalize(notificationChannel);
  }

  public async readByIds(ids: string[]): Promise<NotificationChannelNormalized[]> {
    const notificationChannels = await this.notificationChannelModel
      .find({ _id: { $in: ids } })
      .lean<NotificationChannelEntity[]>()
      .exec();

    return notificationChannels.map(NotificationChannelSerializer.normalize);
  }

  public async readByClusterId(clusterId: string): Promise<NotificationChannelNormalized[]> {
    const notificationChannels = await this.notificationChannelModel
      .find({ clusterId })
      .lean<NotificationChannelEntity[]>()
      .exec();

    return notificationChannels.map(NotificationChannelSerializer.normalize);
  }

  public async countByClusterId(clusterId: string): Promise<number> {
    return this.notificationChannelModel.countDocuments({ clusterId }).exec();
  }

  public async readExistingTelegramChannelByChatIdAndClusterId(
    chatId: string,
    clusterId: string,
  ): Promise<NotificationChannelNormalized | null> {
    const notificationChannel = await this.notificationChannelModel
      .findOne({ clusterId, 'options.chatId': chatId })
      .lean<NotificationChannelEntity>()
      .exec();

    return notificationChannel
      ? NotificationChannelSerializer.normalize(notificationChannel)
      : null;
  }

  public async belongToCluster(
    notificationChannelsIds: string[],
    clusterId: string,
  ): Promise<boolean> {
    const notificationChannels = await this.notificationChannelModel
      .find({ _id: { $in: notificationChannelsIds }, clusterId })
      .lean<NotificationChannelEntity[]>()
      .exec();

    return notificationChannels.length === notificationChannelsIds.length;
  }
}
