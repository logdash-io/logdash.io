import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsMongoId, ValidateIf } from 'class-validator';

export const ACCESS_RESTRICTION_KINDS = ['all', 'clusters', 'projects'] as const;

export type AccessRestrictionKind = (typeof ACCESS_RESTRICTION_KINDS)[number];

export type AccessRestriction =
  | { kind: 'all' }
  | { kind: 'clusters'; ids: string[] }
  | { kind: 'projects'; ids: string[] };

/**
 * Validator counterpart of `AccessRestriction`. Shared by every body that lets
 * a caller mint a key (personal api keys, cli authorization) because the value
 * is persisted verbatim and later used for authorization decisions.
 */
export class AccessRestrictionValidator {
  @ApiProperty({ enum: ACCESS_RESTRICTION_KINDS })
  @IsIn(ACCESS_RESTRICTION_KINDS)
  kind: AccessRestrictionKind;

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((restriction) => restriction.kind !== 'all')
  @IsArray()
  @ArrayMaxSize(100)
  @IsMongoId({ each: true })
  ids?: string[];
}
