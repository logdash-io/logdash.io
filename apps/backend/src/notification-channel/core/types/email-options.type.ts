import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class EmailOptionsValidator {
  @ApiProperty({ description: 'Must be the email of a member of the domain' })
  @IsEmail()
  @MaxLength(320)
  public email: string;
}

export interface EmailOptions {
  email: string;
}
