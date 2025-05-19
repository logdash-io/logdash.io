import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

@Schema({ collection: 'metrics' })
export class MetricEntity {
  _id: Types.ObjectId;

  @Prop()
  metricRegisterEntryId: string;

  @Prop()
  timeBucket: string;

  @Prop()
  value: number;

  @Prop()
  projectId: string;

  @Prop()
  granularity: MetricGranularity;
}

export type MetricDocument = HydratedDocument<MetricEntity>;

export const MetricSchema = SchemaFactory.createForClass(MetricEntity);
