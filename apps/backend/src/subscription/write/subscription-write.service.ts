import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionDocument, SubscriptionEntity } from '../core/entities/subscription.entity';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionWriteService {
  constructor(
    @InjectModel(SubscriptionEntity.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  public async create(dto: CreateSubscriptionDto): Promise<SubscriptionEntity> {
    const subscription = this.subscriptionModel.create({
      userId: dto.userId,
      tier: dto.tier,
      startedAt: dto.startedAt,
      endsAt: dto.endsAt,
    });

    return subscription;
  }

  public async updateOne(dto: UpdateSubscriptionDto): Promise<SubscriptionEntity | null> {
    return this.subscriptionModel.findByIdAndUpdate(dto.id, dto, { new: true }).exec();
  }

  public async delete(id: string): Promise<void> {
    await this.subscriptionModel.findByIdAndDelete(id).exec();
  }

  public async expireActiveByUserId(userId: string): Promise<void> {
    const now = new Date();
    await this.subscriptionModel
      .updateMany(
        {
          userId,
          startedAt: { $lte: now },
          $or: [{ endsAt: { $gt: now } }, { endsAt: { $exists: false } }, { endsAt: null }],
        },
        { endsAt: now },
      )
      .exec();
  }
}
