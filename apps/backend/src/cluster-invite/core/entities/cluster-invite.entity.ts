import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

@Schema({ collection: 'clusterInvites', timestamps: true })
export class ClusterInviteEntity {
  _id: string;

  @Prop()
  inviterUserId: string;

  @Prop()
  invitedUserId: string;

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
