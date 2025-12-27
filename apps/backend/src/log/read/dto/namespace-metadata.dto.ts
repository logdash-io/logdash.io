import { ApiProperty } from '@nestjs/swagger';

export class NamespaceMetadata {
  @ApiProperty()
  namespace: string;

  @ApiProperty()
  lastLogDate: string;
}
