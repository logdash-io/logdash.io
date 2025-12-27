import { LogLevel } from '../../core/enums/log-level.enum';

export interface LogCreatedEvent {
  id: string;
  createdAt: string;
  message: string;
  level: LogLevel;
  projectId: string;
  sequenceNumber?: number;
  namespace?: string;
}
