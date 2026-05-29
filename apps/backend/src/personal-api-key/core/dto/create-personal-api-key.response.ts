import { ApiProperty } from '@nestjs/swagger';
import { AccessRestriction } from '../types/access-restriction.type';
import { ScopeEntry } from '../types/scope-entry.type';

/**
 * The ONLY response that includes the plaintext `value`. Shown once at creation
 * and never again.
 */
export class CreatePersonalApiKeyResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  prefix: string;

  @ApiProperty({ description: 'Plaintext key value. Shown once — store it now.' })
  value: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  scopes: ScopeEntry[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  access: AccessRestriction;

  @ApiProperty({ required: false, nullable: true })
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;
}
