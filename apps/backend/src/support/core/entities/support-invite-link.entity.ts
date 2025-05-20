import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'supportInviteLinks', timestamps: true })
export class SupportInviteLinkEntity {
  _id: Types.ObjectId;

  @Prop()
  userId: string;

  @Prop()
  url: string;
}

export type SupportInviteLinkDocument =
  HydratedDocument<SupportInviteLinkEntity>;

export const SupportinviteLinkSchema = SchemaFactory.createForClass(
  SupportInviteLinkEntity,
);
