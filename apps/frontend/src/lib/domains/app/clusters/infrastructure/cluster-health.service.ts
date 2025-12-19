import { monitoringService } from '$lib/domains/app/projects/infrastructure/monitoring.service.js';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';

export class ClusterHealthService {
  public static async getClusterMonitors(
    clusterId: string,
  ): Promise<Monitor[]> {
    return monitoringService.getMonitors(clusterId);
  }
}
