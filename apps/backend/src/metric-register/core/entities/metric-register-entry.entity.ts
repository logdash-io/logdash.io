import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PartialRecord } from '../../../shared/types/partial-record.type';

export enum MetricRegisterEntryType {
  Counter = 'counter',
}

export interface CounterValues {
  absoluteValue: number;
}

type Values = CounterValues;

@Schema({ collection: 'metricRegisterEntries' })
export class MetricRegisterEntryEntity {
  _id: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  projectId: string;

  @Prop({ default: MetricRegisterEntryType.Counter })
  type: MetricRegisterEntryType;

  @Prop({ type: Object, default: {} })
  values: PartialRecord<MetricRegisterEntryType, Values>;
}

export type MetricRegisterEntryDocument = HydratedDocument<MetricRegisterEntryEntity>;

export const MetricRegisterEntrySchema = SchemaFactory.createForClass(MetricRegisterEntryEntity);
