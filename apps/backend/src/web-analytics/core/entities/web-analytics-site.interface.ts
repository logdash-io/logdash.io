import { ApiProperty } from '@nestjs/swagger';

export class WebAnalyticsSiteNormalized {
  id: string;
  clusterId: string;
  origins: string[];
  goals: string[];
}

export class WebAnalyticsSiteSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty({ type: String, isArray: true })
  origins: string[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'The goals picked for the dashboard: the primary one, then up to 9 more',
  })
  goals: string[];
}

export class WebAnalyticsSiteResponse {
  @ApiProperty({ type: WebAnalyticsSiteSerialized, nullable: true })
  site: WebAnalyticsSiteSerialized | null;
}
