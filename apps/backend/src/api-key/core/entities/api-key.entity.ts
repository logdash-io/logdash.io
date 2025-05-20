import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'apiKeys', timestamps: true })
export class ApiKeyEntity {
  _id: Types.ObjectId;

  @Prop()
  value: string;

  @Prop()
  projectId: string;
}

export type ApiKeyDocument = HydratedDocument<ApiKeyEntity>;

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyEntity);
