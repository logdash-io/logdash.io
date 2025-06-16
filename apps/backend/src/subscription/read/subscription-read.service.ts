import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionDocument, SubscriptionEntity } from '../core/entities/subscription.entity';
import { SubscriptionNormalized } from '../core/entities/subscription.interface';
import { SubscriptionSerializer } from '../core/entities/subscription.serializer';

@Injectable()
export class SubscriptionReadService {
  constructor(
    @InjectModel(SubscriptionEntity.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  public async readActiveByUserId(userId: string): Promise<SubscriptionNormalized | null> {
    const now = new Date();
    const subscription = await this.subscriptionModel
      .findOne({
        userId,
        startedAt: { $lte: now },
        $or: [{ endsAt: { $gt: now } }, { endsAt: { $exists: false } }, { endsAt: null }],
      })
      .lean<SubscriptionEntity>()
      .exec();

    return subscription ? SubscriptionSerializer.normalize(subscription) : null;
  }

  public async readByUserId(userId: string): Promise<SubscriptionNormalized[]> {
    const subscriptions = await this.subscriptionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean<SubscriptionEntity[]>()
      .exec();

    return subscriptions.map(SubscriptionSerializer.normalize);
  }

  public async readById(id: string): Promise<SubscriptionNormalized | null> {
    const subscription = await this.subscriptionModel
      .findById(id)
      .lean<SubscriptionEntity>()
      .exec();

    return subscription ? SubscriptionSerializer.normalize(subscription) : null;
  }
}
