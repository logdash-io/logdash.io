import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsDefined,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AccessRestriction, AccessRestrictionValidator } from '../types/access-restriction.type';
import { ScopeEntry, ScopeEntryValidator } from '../types/scope-entry.type';

export class CreatePersonalApiKeyBody {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  label: string;

  @ApiProperty({
    type: [ScopeEntryValidator],
    description: 'Expanded scope array ({ resource, action }[]).',
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ScopeEntryValidator)
  scopes: ScopeEntry[];

  @ApiProperty({
    type: AccessRestrictionValidator,
    description: "Access restriction: { kind: 'all' | 'clusters' | 'projects'; ids?: string[] }.",
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => AccessRestrictionValidator)
  access: AccessRestriction;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
