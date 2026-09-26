import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { NoImplicitConversion } from '../../../shared/utils/no-implicit-conversion.decorator';

export class UpdatePublicDashboardBody {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @NoImplicitConversion()
  @IsBoolean()
  isPublic?: boolean;
}
