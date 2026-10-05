import { ApiProperty } from '@nestjs/swagger';

export class WebAnalyticsSiteNormalized {
  id: string;
  clusterId: string;
  origins: string[];
}

export class WebAnalyticsSiteSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty({ type: String, isArray: true })
  origins: string[];
}

export class WebAnalyticsSiteResponse {
  @ApiProperty({ type: WebAnalyticsSiteSerialized, nullable: true })
  site: WebAnalyticsSiteSerialized | null;
}
