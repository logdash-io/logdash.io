import { NotificationChannelEntity } from './notification-channel.entity';
import {
  NotificationChannelNormalized,
  NotificationChannelSerialized,
} from './notification-channel.interface';

export class NotificationChannelSerializer {
  public static normalize(entity: NotificationChannelEntity): NotificationChannelNormalized {
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
    normalized: NotificationChannelNormalized,
  ): NotificationChannelSerialized {
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
