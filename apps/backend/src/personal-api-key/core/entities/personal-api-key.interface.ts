import { ApiProperty } from '@nestjs/swagger';
import { AccessRestriction } from '../types/access-restriction.type';
import { ScopeEntry } from '../types/scope-entry.type';

export class PersonalApiKeyNormalized {
  id: string;
  userId: string;
  label: string;
  prefix: string;
  hash: string;
  scopes: ScopeEntry[];
  access: AccessRestriction;
  expiresAt?: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

/**
 * Public-facing shape returned by list/get endpoints. Never includes `value`
 * (plaintext, shown once at creation) or `hash`.
 */
export class PersonalApiKeySerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  prefix: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  scopes: ScopeEntry[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  access: AccessRestriction;

  @ApiProperty({ required: false, nullable: true })
  expiresAt?: Date;

  @ApiProperty({ required: false, nullable: true })
  lastUsedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}
