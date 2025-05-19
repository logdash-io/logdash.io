import { ApiProperty } from '@nestjs/swagger';

export class UrlResponse {
  @ApiProperty()
  public url: string;
}
