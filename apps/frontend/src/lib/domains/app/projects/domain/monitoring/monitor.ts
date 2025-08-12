import type { MonitorMode } from './monitor-mode.js';

export type Monitor = {
  id: string;
  url?: string;
  name: string;
  projectId: string;
  notificationChannelsIds: string[];
  lastStatusCode: number;
  mode: MonitorMode;
};
