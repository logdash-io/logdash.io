import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionDocument, SubscriptionEntity } from '../core/entities/subscription.entity';

@Injectable()
export class SubscriptionReadService {
  constructor(
    @InjectModel(SubscriptionEntity.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  public async readActiveByUserId(userId: string): Promise<SubscriptionEntity | null> {
    const now = new Date();
    return this.subscriptionModel
      .findOne({
        userId,
        startedAt: { $lte: now },
        $or: [{ endsAt: { $gt: now } }, { endsAt: { $exists: false } }, { endsAt: null }],
      })
      .exec();
  }

  public async readByUserId(userId: string): Promise<SubscriptionEntity[]> {
    return this.subscriptionModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  public async readById(id: string): Promise<SubscriptionEntity | null> {
    return this.subscriptionModel.findById(id).exec();
  }
}
