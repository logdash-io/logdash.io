import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AccessRestriction } from '../types/access-restriction.type';
import { ScopeEntry } from '../types/scope-entry.type';

export class CreatePersonalApiKeyBody {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Expanded scope array ({ resource, action }[]).',
  })
  @IsArray()
  @ArrayMinSize(0)
  scopes: ScopeEntry[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: "Access restriction: { kind: 'all' | 'clusters' | 'projects'; ids?: string[] }.",
  })
  @IsObject()
  access: AccessRestriction;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
