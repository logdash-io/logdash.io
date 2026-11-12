import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { NoImplicitConversion } from '../../../shared/utils/no-implicit-conversion.decorator';

export const MAX_WEB_ANALYTICS_VIEWS = 10;

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class WebAnalyticsViewBody {
  @ApiPropertyOptional({ description: 'Pass the id of an existing view to keep or rename it' })
  @IsOptional()
  @IsMongoId()
  id?: string;

  @ApiProperty({ example: 'Product' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Show the built-in traffic cards in this view. No view shows them unless it says so',
  })
  @IsOptional()
  @NoImplicitConversion()
  @IsBoolean()
  traffic?: boolean;
}

export class UpdateWebAnalyticsViewsBody {
  @ApiProperty({
    type: WebAnalyticsViewBody,
    isArray: true,
    description:
      'Replaces the views of the domain, the first one is the default. An empty list clears the layout',
  })
  @IsArray()
  @ArrayMaxSize(MAX_WEB_ANALYTICS_VIEWS)
  @ValidateNested({ each: true })
  @Type(() => WebAnalyticsViewBody)
  views: WebAnalyticsViewBody[];

  @ApiPropertyOptional({
    description:
      'The viewsVersion the views were read at. When the views changed since, the call fails with 409 instead of overwriting them',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  version?: number;
}
