import type { LogLevel } from './log-level';

export type Log = {
  id: string;
  message: string;
  level: LogLevel;
  createdAt: Date;
  index?: number;
  sequenceNumber?: number;
};
