import { ApiProperty } from '@nestjs/swagger';

export class ProbeHttpMonitorUrlResponse {
  @ApiProperty({
    description: 'The url answers with the same body as a made up path on its host',
  })
  catchAll: boolean;

  @ApiProperty({ type: [String], example: ['/health'] })
  healthPaths: string[];
}
