import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'cluster-invites', timestamps: true })
export class ClusterInviteEntity {
  _id: string;

  @Prop()
  inviterUserId: string;

  @Prop()
  invitedUserId: string;

  @Prop()
  clusterId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type ClusterInviteDocument = HydratedDocument<ClusterInviteEntity>;

export const ClusterInviteSchema = SchemaFactory.createForClass(ClusterInviteEntity);
