import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AccessRestriction } from '../types/access-restriction.type';
import { ScopeEntry } from '../types/scope-entry.type';

@Schema({ collection: 'personalApiKeys', timestamps: true })
export class PersonalApiKeyEntity {
  _id: Types.ObjectId;

  @Prop()
  userId: string; // owner; reach is bounded by THIS user's live membership

  @Prop()
  label: string; // required, free-form

  @Prop()
  prefix: string; // public: "ldp_" + first 8 chars of value. Indexed.

  @Prop()
  hash: string; // HMAC-SHA256(value, secret). Plaintext NEVER stored.

  @Prop({ type: Array, default: [] })
  scopes: ScopeEntry[];

  @Prop({ type: Object, default: { kind: 'all' } })
  access: AccessRestriction;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ type: Date })
  revokedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type PersonalApiKeyDocument = HydratedDocument<PersonalApiKeyEntity>;

export const PersonalApiKeySchema = SchemaFactory.createForClass(PersonalApiKeyEntity);

PersonalApiKeySchema.index({ prefix: 1, revokedAt: 1 });
PersonalApiKeySchema.index({ userId: 1, createdAt: -1 });
