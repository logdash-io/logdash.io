import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricOperation } from '../enums/metric-operation.enum';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppName } from '../../../shared/utils/app-name.decorator';

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

  @AppName()
  app?: string;

  @ApiPropertyOptional({
    description:
      'Accepted so SDKs can send the namespace of their logger. Metrics are not split by namespace.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  namespace?: string;
}
