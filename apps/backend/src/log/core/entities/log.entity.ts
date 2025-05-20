import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LogLevel } from '../enums/log-level.enum';

@Schema({ collection: 'logs' })
export class LogEntity {
  _id: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  message: string;

  @Prop()
  level: LogLevel;

  @Prop()
  projectId: string;

  @Prop()
  index: number;
}

export type LogDocument = HydratedDocument<LogEntity>;

export const LogSchema = SchemaFactory.createForClass(LogEntity);
