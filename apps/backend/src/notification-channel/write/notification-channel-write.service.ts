import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { NotificationChannelEntity } from '../core/entities/notification-channel.entity';
import { NotificationChannelNormalized } from '../core/entities/notification-channel.interface';
import { NotificationChannelSerializer } from '../core/entities/notification-channel.serializer';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';

@Injectable()
export class NotificationChannelWriteService {
  constructor(
    @InjectModel(NotificationChannelEntity.name)
    private notificationChannelModel: Model<NotificationChannelEntity>,
  ) {}

  public async create(dto: CreateNotificationChannelDto): Promise<NotificationChannelNormalized> {
    const notificationChannel = await this.notificationChannelModel.create({
      _id: new Types.ObjectId(),
      clusterId: dto.clusterId,
      target: dto.type,
      options: dto.options,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NotificationChannelSerializer.normalize(notificationChannel);
  }

  public async update(dto: UpdateNotificationChannelDto): Promise<NotificationChannelNormalized> {
    const updateQuery: UpdateQuery<NotificationChannelEntity> = {};

    if (dto.options) {
      updateQuery.options = dto.options;
    }

    const notificationChannel = await this.notificationChannelModel.findOneAndUpdate(
      { _id: new Types.ObjectId(dto.id) },
      updateQuery,
      { new: true },
    );

    if (!notificationChannel) {
      throw new Error(`Notification channel with id ${dto.id} not found for update`);
    }

    return NotificationChannelSerializer.normalize(notificationChannel);
  }

  public async delete(id: string): Promise<void> {
    await this.notificationChannelModel.deleteOne({ _id: new Types.ObjectId(id) });
  }
}
