import type { CustomDomain } from './custom-domain';

export type PublicDashboard = {
  id: string;
  clusterId: string;
  httpMonitorsIds: string[];
  name: string;
  isPublic: boolean;
  autoAddMonitors: boolean;
  customDomain?: CustomDomain;
};
