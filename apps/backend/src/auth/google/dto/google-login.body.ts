import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginBody {
  @ApiProperty()
  googleCode: string;

  @ApiPropertyOptional()
  termsAccepted?: boolean;

  @ApiPropertyOptional()
  emailAccepted?: boolean;

  forceLocalLogin?: boolean;
}
