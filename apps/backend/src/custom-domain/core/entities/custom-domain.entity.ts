import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CustomDomainStatus } from '../enums/custom-domain-status.enum';

@Schema({ collection: 'customDomains', timestamps: true })
export class CustomDomainEntity {
  _id: string;

  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  publicDashboardId: string;

  @Prop({ default: 0 })
  attemptCount: number;

  @Prop({ enum: CustomDomainStatus, default: CustomDomainStatus.Verifying })
  status: CustomDomainStatus;

  createdAt: Date;
  updatedAt: Date;
}

export type CustomDomainDocument = HydratedDocument<CustomDomainEntity>;

export const CustomDomainSchema = SchemaFactory.createForClass(CustomDomainEntity);
