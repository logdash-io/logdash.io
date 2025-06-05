import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApiKeyAuthBody {
  @ApiProperty({ description: 'API key value for authentication' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}
