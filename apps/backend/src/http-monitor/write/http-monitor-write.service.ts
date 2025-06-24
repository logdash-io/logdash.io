import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { CreateHttpMonitorBody } from '../core/dto/create-http-monitor.body';
import { HttpMonitorEntity } from '../core/entities/http-monitor.entity';
import { HttpMonitorNormalized } from '../core/entities/http-monitor.interface';
import { HttpMonitorSerializer } from '../core/entities/http-monitor.serializer';
import { UpdateHttpMonitorBody } from '../core/dto/update-http-monitor.body';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import {
  AuditLogEntityAction,
  AuditLogHttpMonitorAction,
  AuditLogNotificationChannelAction,
} from '../../audit-log/core/enums/audit-log-actions.enum';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';

@Injectable()
export class HttpMonitorWriteService {
  constructor(
    @InjectModel(HttpMonitorEntity.name)
    private readonly httpMonitorModel: Model<HttpMonitorEntity>,
    private readonly auditLog: AuditLog,
  ) {}

  async create(
    projectId: string,
    dto: CreateHttpMonitorBody,
    actorUserId?: string,
  ): Promise<HttpMonitorNormalized> {
    const entity = await this.httpMonitorModel.create({
      projectId,
      name: dto.name,
      url: dto.url,
      notificationChannelsIds: dto.notificationChannelsIds,
    });

    this.auditLog.create({
      userId: actorUserId,
      action: AuditLogEntityAction.Create,
      actor: actorUserId ? Actor.User : Actor.System,
      relatedDomain: RelatedDomain.HttpMonitor,
      relatedEntityId: entity._id.toString(),
    });

    if (dto.notificationChannelsIds) {
      dto.notificationChannelsIds.forEach((notificationChannelId) => {
        this.auditLog.create({
          userId: actorUserId,
          relatedDomain: RelatedDomain.NotificationChannel,
          actor: Actor.User,
          action: AuditLogNotificationChannelAction.AddedToMonitor,
          relatedEntityId: notificationChannelId,
          description: `Added to monitor ${entity._id}`,
        });
      });

      this.auditLog.create({
        userId: actorUserId,
        relatedDomain: RelatedDomain.HttpMonitor,
        actor: Actor.User,
        action: AuditLogHttpMonitorAction.AddedNotificationChannel,
        relatedEntityId: entity._id.toString(),
        description: `Added notification channels ${dto.notificationChannelsIds.join(', ')} to monitor`,
      });
    }

    return HttpMonitorSerializer.normalize(entity);
  }

  public async deleteByProjectId(projectId: string, actorUserId?: string): Promise<void> {
    const monitors = await this.httpMonitorModel.find({ projectId });

    monitors.forEach((monitor) => {
      this.auditLog.create({
        userId: actorUserId,
        actor: actorUserId ? Actor.User : Actor.System,
        action: AuditLogEntityAction.Delete,
        relatedDomain: RelatedDomain.HttpMonitor,
        relatedEntityId: monitor._id.toString(),
        description: `Deleted due to project deletion`,
      });
    });

    await this.httpMonitorModel.deleteMany({ projectId });
  }

  public async update(
    httpMonitorId: string,
    dto: UpdateHttpMonitorBody,
    actorUserId?: string,
  ): Promise<HttpMonitorNormalized> {
    const updateQuery: UpdateQuery<HttpMonitorEntity> = {};
    if (dto.name) {
      updateQuery.name = dto.name;
    }
    if (dto.url) {
      updateQuery.url = dto.url;
    }

    if (dto.notificationChannelsIds) {
      updateQuery.notificationChannelsIds = dto.notificationChannelsIds;
    }

    const entity = await this.httpMonitorModel.findByIdAndUpdate(httpMonitorId, updateQuery, {
      new: true,
    });

    if (!entity) {
      throw new NotFoundException('Http monitor not found');
    }

    this.auditLog.create({
      userId: actorUserId,
      action: AuditLogEntityAction.Update,
      actor: actorUserId ? Actor.User : Actor.System,
      relatedDomain: RelatedDomain.HttpMonitor,
      relatedEntityId: httpMonitorId,
    });

    return HttpMonitorSerializer.normalize(entity);
  }

  public async deleteById(httpMonitorId: string, actorUserId?: string): Promise<void> {
    await this.auditLog.create({
      userId: actorUserId,
      actor: actorUserId ? Actor.User : Actor.System,
      action: AuditLogEntityAction.Delete,
      relatedDomain: RelatedDomain.HttpMonitor,
      relatedEntityId: httpMonitorId,
    });

    await this.httpMonitorModel.findByIdAndDelete(httpMonitorId);
  }

  public async addNotificationChannel(
    httpMonitorId: string,
    notificationChannelId: string,
    actorUserId: string,
  ): Promise<void> {
    this.auditLog.create({
      userId: actorUserId,
      relatedDomain: RelatedDomain.HttpMonitor,
      actor: Actor.User,
      action: AuditLogHttpMonitorAction.AddedNotificationChannel,
      relatedEntityId: httpMonitorId,
      description: `Added notification channel ${notificationChannelId} to monitor`,
    });

    this.auditLog.create({
      userId: actorUserId,
      relatedDomain: RelatedDomain.NotificationChannel,
      actor: Actor.User,
      action: AuditLogNotificationChannelAction.AddedToMonitor,
      relatedEntityId: notificationChannelId,
      description: `Added to monitor ${httpMonitorId}`,
    });

    await this.httpMonitorModel.findByIdAndUpdate(httpMonitorId, {
      $addToSet: { notificationChannelsIds: notificationChannelId },
    });
  }

  public async removeNotificationChannel(
    httpMonitorId: string,
    notificationChannelId: string,
    actorUserId: string,
  ): Promise<void> {
    this.auditLog.create({
      userId: actorUserId,
      relatedDomain: RelatedDomain.HttpMonitor,
      actor: Actor.User,
      action: AuditLogHttpMonitorAction.RemovedNotificationChannel,
      relatedEntityId: httpMonitorId,
      description: `Removed notification channel ${notificationChannelId} from monitor`,
    });

    this.auditLog.create({
      userId: actorUserId,
      relatedDomain: RelatedDomain.NotificationChannel,
      actor: Actor.User,
      action: AuditLogNotificationChannelAction.RemovedFromMonitor,
      relatedEntityId: notificationChannelId,
      description: `Removed from monitor ${httpMonitorId}`,
    });

    await this.httpMonitorModel.findByIdAndUpdate(httpMonitorId, {
      $pull: { notificationChannelsIds: notificationChannelId },
    });
  }
}
