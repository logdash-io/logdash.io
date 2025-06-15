import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsMongoId, IsOptional, MaxLength } from 'class-validator';

export class CreatePublicDashboardBody {
  @ApiPropertyOptional({ isArray: true })
  @IsOptional()
  @IsMongoId({ each: true })
  @ArrayMaxSize(10)
  httpMonitorsIds?: string[];
}
