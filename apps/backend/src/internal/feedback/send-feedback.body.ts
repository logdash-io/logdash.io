import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { NoImplicitConversion } from '../../shared/utils/no-implicit-conversion.decorator';
import { trimToUndefined } from '../../shared/utils/trim-to-undefined';

export class SendFeedbackBody {
  @ApiProperty({ maxLength: 2000 })
  @Transform(trimToUndefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @NoImplicitConversion()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
