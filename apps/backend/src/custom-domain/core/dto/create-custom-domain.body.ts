import { ApiProperty } from '@nestjs/swagger';
import { MaxLength, IsUrl } from 'class-validator';

export class CreateCustomDomainBody {
  @ApiProperty()
  @IsUrl()
  @MaxLength(256)
  domain: string;
}
