import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApiKeyAuthResponse {
  @ApiProperty()
  token: string;

  @ApiProperty()
  projectId: string;
}
