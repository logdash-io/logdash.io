import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserTier } from '../../../user/core/enum/user-tier.enum';

@Schema({ collection: 'subscriptions', timestamps: true })
export class SubscriptionEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  tier: UserTier;

  @Prop({ type: Date, required: true })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  endsAt: Date | null;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type SubscriptionDocument = HydratedDocument<SubscriptionEntity>;

export const SubscriptionSchema = SchemaFactory.createForClass(SubscriptionEntity);
