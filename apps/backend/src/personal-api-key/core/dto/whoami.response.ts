import { ApiProperty } from '@nestjs/swagger';
import { AccessRestriction } from '../types/access-restriction.type';
import { ScopeEntry } from '../types/scope-entry.type';

export class WhoamiResponse {
  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false, nullable: true })
  label?: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  scopes: ScopeEntry[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  access: AccessRestriction;

  @ApiProperty({ required: false, nullable: true })
  prefix?: string;

  @ApiProperty({ required: false, nullable: true })
  expiresAt?: Date;
}
