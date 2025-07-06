import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AuthMethod } from '../enum/auth-method.enum';
import { AccountClaimStatus } from '../enum/account-claim-status.enum';
import { UserTier } from '../enum/user-tier.enum';

export interface PaymentsMetadata {
  usedTrial: boolean;
}

@Schema({ collection: 'users', timestamps: true })
export class UserEntity {
  _id: Types.ObjectId;

  @Prop()
  email: string;

  @Prop()
  authMethod?: AuthMethod;

  @Prop()
  passwordHash?: string;

  @Prop()
  accountClaimStatus: AccountClaimStatus;

  @Prop({ type: Date })
  lastActivityDate: string;

  @Prop()
  tier: UserTier;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  marketingConsent: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({ type: Object, default: {} })
  paymentsMetadata?: PaymentsMetadata;
}

export type UserDocument = HydratedDocument<UserEntity>;

export const UserSchema = SchemaFactory.createForClass(UserEntity);
