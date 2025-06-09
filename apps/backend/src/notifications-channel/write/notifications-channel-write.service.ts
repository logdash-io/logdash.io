import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { NotificationsChannelEntity } from '../core/entities/notifications-channel.entity';
import { NotificationsChannelNormalized } from '../core/entities/notifications-channel.interface';
import { NotificationsChannelSerializer } from '../core/entities/notifications-channel.serializer';
import { CreateNotificationsChannelDto } from './dto/create-notifications-channel.dto';
import { UpdateNotificationsChannelDto } from './dto/update-notifications-channel.dto';

@Injectable()
export class NotificationsChannelWriteService {
  constructor(
    @InjectModel(NotificationsChannelEntity.name)
    private notificationsChannelModel: Model<NotificationsChannelEntity>,
  ) {}

  public async create(dto: CreateNotificationsChannelDto): Promise<NotificationsChannelNormalized> {
    const notificationsChannel = await this.notificationsChannelModel.create({
      _id: new Types.ObjectId(),
      clusterId: dto.clusterId,
      target: dto.type,
      options: dto.options,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NotificationsChannelSerializer.normalize(notificationsChannel);
  }

  public async update(dto: UpdateNotificationsChannelDto): Promise<NotificationsChannelNormalized> {
    const updateQuery: UpdateQuery<NotificationsChannelEntity> = {};

    if (dto.options) {
      updateQuery.options = dto.options;
    }

    const notificationsChannel = await this.notificationsChannelModel.findOneAndUpdate(
      { _id: new Types.ObjectId(dto.id) },
      updateQuery,
      { new: true },
    );

    if (!notificationsChannel) {
      throw new Error(`Notifications channel with id ${dto.id} not found for update`);
    }

    return NotificationsChannelSerializer.normalize(notificationsChannel);
  }

  public async delete(id: string): Promise<void> {
    await this.notificationsChannelModel.deleteOne({ _id: new Types.ObjectId(id) });
  }
}
