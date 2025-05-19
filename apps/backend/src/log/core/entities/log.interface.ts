import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '../enums/log-level.enum';

export class LogNormalized {
  id: string;
  createdAt: Date;
  message: string;
  level: LogLevel;
  projectId: string;
  index: number;
}

export class LogSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: LogLevel })
  level: LogLevel;

  @ApiProperty()
  index: number;
}
