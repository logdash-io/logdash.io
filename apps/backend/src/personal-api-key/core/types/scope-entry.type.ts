import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Action } from '../enums/action.enum';
import { Resource } from '../enums/resource.enum';

export type ScopeEntry = { resource: Resource; action: Action };

/**
 * Validator counterpart of `ScopeEntry`. Shared by every body that lets a
 * caller mint a key (personal api keys, cli authorization).
 */
export class ScopeEntryValidator implements ScopeEntry {
  @ApiProperty({ enum: Resource })
  @IsEnum(Resource)
  resource: Resource;

  @ApiProperty({ enum: Action })
  @IsEnum(Action)
  action: Action;
}
