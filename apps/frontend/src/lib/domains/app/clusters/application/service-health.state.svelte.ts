import { ServiceHealthService } from '$lib/domains/app/clusters/infrastructure/service-health.service.js';

export type ServiceHealthTarget = {
  projectId: string;
  monitorId?: string;
};

export class ServiceHealthState {
  public uptime = $state<Record<string, number | null>>({});
  public errors = $state<Record<string, number>>({});

  public async load(targets: ServiceHealthTarget[]): Promise<void> {
    await Promise.all(
      targets.flatMap((target) => [
        this.loadErrors(target.projectId),
        this.loadUptime(target),
      ]),
    );
  }

  private async loadErrors(projectId: string): Promise<void> {
    try {
      this.errors[projectId] =
        await ServiceHealthService.readErrorsLastDay(projectId);
    } catch {
      delete this.errors[projectId];
    }
  }

  private async loadUptime({
    projectId,
    monitorId,
  }: ServiceHealthTarget): Promise<void> {
    if (!monitorId) {
      delete this.uptime[projectId];
      return;
    }

    try {
      this.uptime[projectId] =
        await ServiceHealthService.readUptimeLastDay(monitorId);
    } catch {
      delete this.uptime[projectId];
    }
  }
}
