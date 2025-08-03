import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleClaimProjectBody {
  @ApiProperty()
  googleCode: string;

  @ApiProperty()
  accessToken: string;

  @ApiPropertyOptional()
  emailAccepted?: boolean;

  forceLocalLogin?: boolean;
}
