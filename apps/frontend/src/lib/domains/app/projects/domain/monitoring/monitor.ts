import type { MonitorMode } from './monitor-mode.js';

export type MonitorStatus = 'up' | 'down' | 'unknown';

export type Monitor = {
  id: string;
  url?: string;
  name: string;
  projectId: string;
  notificationChannelsIds: string[];
  lastStatusCode: number;
  lastStatus: MonitorStatus;
  mode: MonitorMode;
};
