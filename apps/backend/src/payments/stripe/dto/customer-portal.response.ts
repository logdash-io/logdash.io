import { ApiProperty } from '@nestjs/swagger';

export class CustomerPortalResponse {
  @ApiProperty()
  customerPortalUrl: string;
}
