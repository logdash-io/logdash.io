import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

@Schema({ collection: 'clusterInvites', timestamps: true })
export class ClusterInviteEntity {
  _id: Types.ObjectId;

  @Prop()
  inviterUserId: string;

  @Prop({ required: true })
  invitedUserEmail: string;

  @Prop()
  clusterId: string;

  @Prop()
  role: ClusterRole;

  createdAt: Date;
  updatedAt: Date;
}

export type ClusterInviteDocument = HydratedDocument<ClusterInviteEntity>;

export const ClusterInviteSchema = SchemaFactory.createForClass(ClusterInviteEntity);
