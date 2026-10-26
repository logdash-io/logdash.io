import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  Matches,
} from 'class-validator';
import { EVENT_NAME } from './collect-web-events.body';

export class UpdateWebAnalyticsGoalsBody {
  @ApiProperty({
    type: String,
    isArray: true,
    example: ['signup', 'download'],
    description: 'The primary goal, then up to 9 more, by custom event name',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(EVENT_NAME, { each: true })
  goals: string[];
}
