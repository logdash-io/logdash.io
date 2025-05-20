import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'metricRegisterEntries' })
export class MetricRegisterEntryEntity {
  _id: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  projectId: string;
}

export type MetricRegisterEntryDocument =
  HydratedDocument<MetricRegisterEntryEntity>;

export const MetricRegisterEntrySchema = SchemaFactory.createForClass(
  MetricRegisterEntryEntity,
);
