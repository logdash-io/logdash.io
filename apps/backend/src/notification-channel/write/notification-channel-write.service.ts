import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { NotificationChannelEntity } from '../core/entities/notification-channel.entity';
import { NotificationChannelNormalized } from '../core/entities/notification-channel.interface';
import { NotificationChannelSerializer } from '../core/entities/notification-channel.serializer';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import { AuditLogEntityAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';

@Injectable()
export class NotificationChannelWriteService {
  constructor(
    @InjectModel(NotificationChannelEntity.name)
    private notificationChannelModel: Model<NotificationChannelEntity>,
    private readonly auditLog: AuditLog,
  ) {}

  public async create(
    dto: CreateNotificationChannelDto,
    actorUserId?: string,
  ): Promise<NotificationChannelNormalized> {
    const notificationChannel = await this.notificationChannelModel.create({
      _id: new Types.ObjectId(),
      clusterId: dto.clusterId,
      target: dto.type,
      options: dto.options,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.auditLog.create({
      userId: actorUserId,
      actor: Actor.User,
      action: AuditLogEntityAction.Create,
      relatedDomain: RelatedDomain.NotificationChannel,
      relatedEntityId: notificationChannel._id.toString(),
    });

    return NotificationChannelSerializer.normalize(notificationChannel);
  }

  public async update(
    dto: UpdateNotificationChannelDto,
    actorUserId?: string,
  ): Promise<NotificationChannelNormalized> {
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

    this.auditLog.create({
      userId: actorUserId,
      actor: Actor.User,
      action: AuditLogEntityAction.Update,
      relatedDomain: RelatedDomain.NotificationChannel,
      relatedEntityId: dto.id,
    });

    return NotificationChannelSerializer.normalize(notificationChannel);
  }

  public async delete(id: string, actorUserId?: string): Promise<void> {
    await this.auditLog.create({
      userId: actorUserId,
      actor: Actor.User,
      action: AuditLogEntityAction.Delete,
      relatedDomain: RelatedDomain.NotificationChannel,
      relatedEntityId: id,
    });

    await this.notificationChannelModel.deleteOne({ _id: new Types.ObjectId(id) });
  }
}
