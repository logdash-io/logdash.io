import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ClusterTier } from '../enums/cluster-tier.enum';
import { ClusterRole } from '../enums/cluster-role.enum';

@Schema({ collection: 'clusters', timestamps: true })
export class ClusterEntity {
  _id: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  creatorId: string;

  @Prop()
  tier: ClusterTier;

  @Prop({ default: {}, type: Object })
  roles: Record<string, ClusterRole>;

  @Prop()
  color?: string;
}

export type ClusterDocument = HydratedDocument<ClusterEntity>;

export const ClusterSchema = SchemaFactory.createForClass(ClusterEntity);
