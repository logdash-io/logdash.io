import { NotificationsChannelEntity } from './notifications-channel.entity';
import {
  NotificationsChannelNormalized,
  NotificationsChannelSerialized,
} from './notifications-channel.interface';

export class NotificationsChannelSerializer {
  public static normalize(entity: NotificationsChannelEntity): NotificationsChannelNormalized {
    return {
      id: entity._id.toString(),
      clusterId: entity.clusterId,
      target: entity.target,
      options: entity.options,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static serialize(
    normalized: NotificationsChannelNormalized,
  ): NotificationsChannelSerialized {
    return {
      id: normalized.id,
      clusterId: normalized.clusterId,
      target: normalized.target,
      options: normalized.options,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
    };
  }
}
