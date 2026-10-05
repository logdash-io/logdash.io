import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength } from 'class-validator';

export class ConfigureWebAnalyticsBody {
  @ApiProperty({ type: String, isArray: true, example: ['https://example.com'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  origins: string[];
}
