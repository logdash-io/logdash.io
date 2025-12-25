import { LogLevel } from '../../core/enums/log-level.enum';

export class CreateLogDto {
  id: string;
  createdAt: Date;
  message: string;
  level: LogLevel;
  projectId: string;
  index?: number;
  sequenceNumber?: number;
  namespace?: string;
}
