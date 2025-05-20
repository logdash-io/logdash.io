import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponse {
  @ApiProperty()
  checkoutUrl: string;
}
