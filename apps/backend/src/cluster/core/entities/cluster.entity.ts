import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ClusterTier } from '../enums/cluster-tier.enum';
import { ClusterRole } from '../enums/cluster-role.enum';

@Schema({ collection: 'clusters', timestamps: true })
export class ClusterEntity {
  _id: string;

  @Prop()
  name: string;

  @Prop()
  members: string[];

  @Prop()
  creatorId: string;

  @Prop()
  tier: ClusterTier;

  @Prop({ default: {}, type: Object })
  roles: Record<string, ClusterRole>;
}

export type ClusterDocument = HydratedDocument<ClusterEntity>;

export const ClusterSchema = SchemaFactory.createForClass(ClusterEntity);
