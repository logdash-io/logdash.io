import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { CreateLogBody } from './create-log.body';

export class CreateLogsBatchBody {
  @ApiProperty({
    type: [CreateLogBody],
    description: 'Array of logs to create (maximum 100 logs per batch)',
    maxItems: 100,
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateLogBody)
  logs: CreateLogBody[];
}
