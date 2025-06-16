import { SubscriptionEntity } from './subscription.entity';
import { SubscriptionNormalized, SubscriptionSerialized } from './subscription.interface';

export class SubscriptionSerializer {
  public static normalize(entity: SubscriptionEntity): SubscriptionNormalized {
    return {
      id: entity._id.toString(),
      userId: entity.userId,
      tier: entity.tier,
      startedAt: entity.startedAt,
      endsAt: entity.endsAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static serialize(normalized: SubscriptionNormalized): SubscriptionSerialized {
    return {
      id: normalized.id,
      userId: normalized.userId,
      tier: normalized.tier,
      startedAt: normalized.startedAt.toISOString(),
      endsAt: normalized.endsAt ? normalized.endsAt.toISOString() : null,
      createdAt: normalized.createdAt.toISOString(),
      updatedAt: normalized.updatedAt.toISOString(),
    };
  }
}
