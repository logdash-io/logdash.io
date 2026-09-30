import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { trimToUndefined } from '../../../shared/utils/trim-to-undefined';

export class CreateAnonymousUserBody {
  @ApiPropertyOptional({ maxLength: 255, default: 'My domain' })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clusterName?: string;
}
