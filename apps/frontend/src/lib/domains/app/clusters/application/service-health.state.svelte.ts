import { ServiceHealthService } from '$lib/domains/app/clusters/infrastructure/service-health.service.js';

export class ServiceHealthState {
  public uptime = $state<Record<string, number | null>>({});
  public errors = $state<Record<string, number>>({});

  public async load(dto: {
    projectIds: string[];
    monitorIds: string[];
  }): Promise<void> {
    await Promise.all([
      ...dto.projectIds.map((projectId) => this.loadErrors(projectId)),
      ...dto.monitorIds.map((monitorId) => this.loadUptime(monitorId)),
    ]);
  }

  private async loadErrors(projectId: string): Promise<void> {
    try {
      this.errors[projectId] =
        await ServiceHealthService.readErrorsLastDay(projectId);
    } catch {
      delete this.errors[projectId];
    }
  }

  private async loadUptime(monitorId: string): Promise<void> {
    try {
      this.uptime[monitorId] =
        await ServiceHealthService.readUptimeLastDay(monitorId);
    } catch {
      delete this.uptime[monitorId];
    }
  }
}
