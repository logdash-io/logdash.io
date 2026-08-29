import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  AccessRestriction,
  AccessRestrictionValidator,
} from '../../../personal-api-key/core/types/access-restriction.type';
import {
  ScopeEntry,
  ScopeEntryValidator,
} from '../../../personal-api-key/core/types/scope-entry.type';

export class ApproveCliAuthBody {
  @ApiProperty({
    description: 'The user code the human transcribed from their terminal (XXXX-XXXX).',
  })
  @IsString()
  @MaxLength(32)
  userCode: string;

  @ApiPropertyOptional({
    type: [ScopeEntryValidator],
    description: 'Optional override scopes. Defaults to the CLI_DEFAULT preset.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ScopeEntryValidator)
  scopes?: ScopeEntry[];

  @ApiProperty({
    type: AccessRestrictionValidator,
    description:
      'Required. The consent screen must make this an explicit choice — there is no default.',
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => AccessRestrictionValidator)
  access: AccessRestriction;
}
