import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionEntity, SubscriptionSchema } from '../core/entities/subscription.entity';
import { SubscriptionWriteService } from './subscription-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SubscriptionEntity.name, schema: SubscriptionSchema }]),
  ],
  providers: [SubscriptionWriteService],
  exports: [SubscriptionWriteService],
})
export class SubscriptionWriteModule {}
