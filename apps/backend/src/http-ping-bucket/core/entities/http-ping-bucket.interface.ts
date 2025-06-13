import { ApiProperty } from '@nestjs/swagger';

export class HttpPingBucketNormalized {
  id: string;
  httpMonitorId: string;
  timestamp: Date;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
}

export class HttpPingBucketSerialized {
  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failureCount: number;

  @ApiProperty()
  averageLatencyMs: number;
}
