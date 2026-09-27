import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NoImplicitConversion } from '../../../shared/utils/no-implicit-conversion.decorator';

export class GoogleLoginBody {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  googleCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @NoImplicitConversion()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @NoImplicitConversion()
  @IsBoolean()
  emailAccepted?: boolean;
}
