import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimProjectBody {
  @ApiProperty()
  githubCode: string;

  @ApiProperty()
  accessToken: string;

  @ApiPropertyOptional()
  emailAccepted?: boolean;
}
