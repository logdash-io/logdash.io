export class CreatePublicDashboardDto {
  clusterId: string;
  httpMonitorsIds?: string[];
  name: string;
  isPublic: boolean;
  autoAddMonitors?: boolean;
}
