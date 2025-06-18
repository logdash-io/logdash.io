import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionDocument, SubscriptionEntity } from '../core/entities/subscription.entity';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionNormalized } from '../core/entities/subscription.interface';
import { SubscriptionSerializer } from '../core/entities/subscription.serializer';

@Injectable()
export class SubscriptionWriteService {
  constructor(
    @InjectModel(SubscriptionEntity.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  public async create(dto: CreateSubscriptionDto): Promise<SubscriptionNormalized> {
    const subscription = await this.subscriptionModel.create({
      userId: dto.userId,
      tier: dto.tier,
      startedAt: dto.startedAt,
      endsAt: dto.endsAt,
    });

    return SubscriptionSerializer.normalize(subscription);
  }

  public async updateOne(dto: UpdateSubscriptionDto): Promise<SubscriptionNormalized | null> {
    const subscription = await this.subscriptionModel
      .findByIdAndUpdate(dto.id, dto, { new: true })
      .exec();

    return subscription ? SubscriptionSerializer.normalize(subscription) : null;
  }
}
