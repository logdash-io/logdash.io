import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GithubLoginBody {
  @ApiProperty()
  githubCode: string;

  @ApiPropertyOptional()
  termsAccepted?: boolean;

  @ApiPropertyOptional()
  emailAccepted?: boolean;

  forceLocalLogin?: boolean;
}
