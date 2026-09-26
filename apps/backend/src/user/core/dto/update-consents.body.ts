import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsBoolean } from 'class-validator';
import { NoImplicitConversion } from '../../../shared/utils/no-implicit-conversion.decorator';

export class UpdateConsentsBody {
  @ApiProperty({ enum: [true] })
  @NoImplicitConversion()
  @Equals(true)
  termsAccepted: true;

  @ApiProperty()
  @NoImplicitConversion()
  @IsBoolean()
  marketingConsent: boolean;
}
