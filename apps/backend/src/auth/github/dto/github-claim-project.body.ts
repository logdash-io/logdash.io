import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GithubClaimProjectBody {
  @ApiProperty()
  githubCode: string;

  @ApiProperty()
  accessToken: string;

  @ApiPropertyOptional()
  emailAccepted?: boolean;
}
