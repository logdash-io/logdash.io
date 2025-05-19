import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginBody {
  @ApiProperty()
  githubCode: string;

  @ApiPropertyOptional()
  termsAccepted?: boolean;

  @ApiPropertyOptional()
  emailAccepted?: boolean;
}
