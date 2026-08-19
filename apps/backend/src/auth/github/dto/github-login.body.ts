import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GithubLoginBody {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  githubCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailAccepted?: boolean;
}
