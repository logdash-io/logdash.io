import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyNormalized {
  id: string;
  value: string;
  projectId: string;
}

export class ApiKeySerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  projectId: string;
}
