import { LogLevel } from '../../core/enums/log-level.enum';

export class QueueLogDto {
  createdAt: Date;
  message: string;
  level: LogLevel;
  projectId: string;
  index?: number;
  namespace?: string;
}
