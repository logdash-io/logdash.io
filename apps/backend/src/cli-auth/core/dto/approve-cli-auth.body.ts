import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { AccessRestriction } from '../../../personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../../personal-api-key/core/types/scope-entry.type';

export class ApproveCliAuthBody {
  @ApiProperty({ description: 'The glanceable user code shown in the terminal (XXXX-XXXX).' })
  @IsString()
  userCode: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    description: 'Optional override scopes. Defaults to the CLI_DEFAULT preset.',
  })
  @IsOptional()
  @IsArray()
  scopes?: ScopeEntry[];

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: "Optional access restriction. Defaults to { kind: 'all' }.",
  })
  @IsOptional()
  @IsObject()
  access?: AccessRestriction;
}
