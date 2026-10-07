export class UpdatePublicDashboardDto {
  id: string;
  name?: string;
  isPublic?: boolean;
  autoAddMonitors?: boolean;
}
