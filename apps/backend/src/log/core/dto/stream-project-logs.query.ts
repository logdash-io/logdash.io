import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StreamProjectLogsQuery {
  @ApiPropertyOptional()
  lastId?: string;
}
