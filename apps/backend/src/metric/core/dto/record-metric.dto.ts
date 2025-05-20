import { ApiProperty } from '@nestjs/swagger';
import { MetricOperation } from '../enums/metric-operation.enum';
import { IsEnum, IsNumber, IsString, MaxLength } from 'class-validator';

export class RecordMetricBody {
  @IsString()
  @ApiProperty()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiProperty({ enum: MetricOperation })
  @IsEnum(MetricOperation)
  operation: MetricOperation;
}
