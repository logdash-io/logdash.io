import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyNormalized {
  id: string;
  value: string;
  projectId?: string;
  clusterId?: string;
}

export class ApiKeySerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  projectId: string;
}

export class ClusterIngestKeySerialized {
  @ApiProperty({
    description:
      'Write-only key for every app on this domain. Send it in the project-api-key header and name the app in the app field of each log and metric.',
  })
  value: string;
}

export type IngestKeyTarget = { projectId: string } | { clusterId: string };
