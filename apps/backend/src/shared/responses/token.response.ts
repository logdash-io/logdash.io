import { ApiProperty } from '@nestjs/swagger';

export class TokenResponse {
  @ApiProperty()
  token: string;
}
