import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleClaimProjectBody {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  googleCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailAccepted?: boolean;
}
