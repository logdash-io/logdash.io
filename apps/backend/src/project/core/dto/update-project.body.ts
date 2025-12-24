import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectFeature } from '../enums/project-feature.enum';

export class UpdateProjectBody {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ enum: ProjectFeature, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ProjectFeature, { each: true })
  selectedFeatures?: ProjectFeature[];
}
