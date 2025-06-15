import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HttpPingNormalized {
  id: string;
  httpMonitorId: string;
  statusCode: number;
  responseTimeMs: number;
  message?: string;
  createdAt: Date;
}

export class HttpPingSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  httpMonitorId: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  responseTimeMs: number;

  @ApiPropertyOptional()
  message?: string;

  @ApiProperty()
  createdAt: Date;
}
