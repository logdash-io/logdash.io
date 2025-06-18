import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'publicDashboards', timestamps: true })
export class PublicDashboardEntity {
  _id: string;

  @Prop()
  clusterId: string;

  @Prop({ default: [] })
  httpMonitorsIds: string[];

  @Prop()
  name: string;

  @Prop({ default: false })
  isPublic: boolean;
}

export type PublicDashboardDocument = HydratedDocument<PublicDashboardEntity>;

export const PublicDashboardSchema = SchemaFactory.createForClass(PublicDashboardEntity);
