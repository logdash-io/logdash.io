import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionEntity, SubscriptionSchema } from '../core/entities/subscription.entity';
import { SubscriptionReadService } from './subscription-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SubscriptionEntity.name, schema: SubscriptionSchema }]),
  ],
  providers: [SubscriptionReadService],
  exports: [SubscriptionReadService],
})
export class SubscriptionReadModule {}
