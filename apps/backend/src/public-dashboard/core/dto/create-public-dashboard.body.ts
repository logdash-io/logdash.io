import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePublicDashboardBody {
  @ApiPropertyOptional({ isArray: true })
  @IsOptional()
  @IsMongoId({ each: true })
  @ArrayMaxSize(10)
  httpMonitorsIds?: string[];

  @ApiProperty()
  @IsString()
  @MaxLength(256)
  name: string;

  @ApiProperty()
  @IsBoolean()
  isPublic: boolean;
}
