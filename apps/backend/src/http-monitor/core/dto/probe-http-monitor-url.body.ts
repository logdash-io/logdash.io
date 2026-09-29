import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength } from 'class-validator';
import { IsSafeUrl } from '../../../shared/ssrf/is-safe-url.decorator';

export class ProbeHttpMonitorUrlBody {
  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  @IsUrl()
  @IsSafeUrl()
  url: string;
}
