import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';
import { PartialRecord } from '../../../shared/types/partial-record.type';

@Schema({ collection: 'logMetrics' })
export class LogMetricEntity {
  _id: Types.ObjectId;

  @Prop()
  timeBucket: string;

  @Prop({ type: Object })
  values: PartialRecord<string, number>;

  @Prop()
  granularity: MetricGranularity;

  @Prop()
  projectId: string;
}

export type LogMetricDocument = HydratedDocument<LogMetricEntity>;

export const LogMetricSchema = SchemaFactory.createForClass(LogMetricEntity);
