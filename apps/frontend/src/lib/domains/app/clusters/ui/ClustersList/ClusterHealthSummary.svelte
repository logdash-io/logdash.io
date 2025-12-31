<script lang="ts">
  import { goto } from '$app/navigation';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { LogsService } from '$lib/domains/logs/infrastructure/logs.service.js';
  import type { Log } from '$lib/domains/logs/domain/log.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import { ScrollTextIcon, ActivityIcon } from 'lucide-svelte';
  import { onMount } from 'svelte';

  type ServiceStatus = 'healthy' | 'unhealthy' | 'degraded' | 'unknown';

  type ServiceData = {
    id: string;
    name: string;
    status: ServiceStatus;
    features: Feature[];
  };

  type Props = {
    clusterId: string;
    services: ServiceData[];
  };

  const { clusterId, services }: Props = $props();

  let recentErrors = $state<
    { projectId: string; projectName: string; log: Log }[]
  >([]);
  let loadingErrors = $state(false);

  const recentIncidents = $derived.by(() => {
    const incidents: { projectId: string; projectName: string; time: Date }[] =
      [];

    for (const service of services) {
      const monitor = monitoringState.getMonitorByProjectId(service.id);
      if (!monitor) continue;

      const pings = monitoringState.monitoringPings(monitor.id);
      if (pings.length < 2) continue;

      for (let i = pings.length - 1; i > 0; i--) {
        const current = pings[i];
        const prev = pings[i - 1];
        const currentHealthy =
          current.statusCode >= 200 && current.statusCode < 400;
        const prevHealthy = prev.statusCode >= 200 && prev.statusCode < 400;

        if (!currentHealthy && prevHealthy) {
          incidents.push({
            projectId: service.id,
            projectName: service.name,
            time: current.createdAt,
          });
        }
      }
    }

    return incidents
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 3);
  });

  const servicesWithLogging = $derived(
    services.filter((s) => s.features.includes(Feature.LOGGING)),
  );

  async function loadRecentErrors(): Promise<void> {
    if (servicesWithLogging.length === 0) {
      recentErrors = [];
      return;
    }

    loadingErrors = true;

    try {
      const errorPromises = servicesWithLogging.map(async (service) => {
        try {
          const logs = await LogsService.getProjectLogs(service.id, {
            levels: ['error'],
            limit: 3,
          });
          return logs.map((log) => ({
            projectId: service.id,
            projectName: service.name,
            log: { ...log, createdAt: new Date(log.createdAt) },
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(errorPromises);
      recentErrors = results
        .flat()
        .sort((a, b) => b.log.createdAt.getTime() - a.log.createdAt.getTime())
        .slice(0, 3);
    } finally {
      loadingErrors = false;
    }
  }

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  function truncateMessage(message: string, maxLength: number = 40): string {
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + '...';
  }

  function onServiceClick(projectId: string): void {
    goto(`/app/clusters/${clusterId}/${projectId}`);
  }

  onMount(() => {
    loadRecentErrors();
  });
</script>

<div class="flex flex-col gap-3">
  {#if recentIncidents.length > 0}
    <div class="flex flex-col gap-1">
      <div
        class="text-base-content/60 flex items-center gap-1.5 text-xs font-medium"
      >
        <ActivityIcon class="size-3" />
        <span>Recent incidents</span>
      </div>
      {#each recentIncidents as incident}
        <button
          onclick={() => onServiceClick(incident.projectId)}
          class="group flex items-center justify-between rounded-lg bg-error/5 px-2 py-1 text-left transition-colors hover:bg-error/10"
        >
          <span class="text-xs text-error">{incident.projectName}</span>
          <span class="text-base-content/40 text-xs">
            {formatTimeAgo(incident.time)}
          </span>
        </button>
      {/each}
    </div>
  {/if}

  {#if recentErrors.length > 0}
    <div class="flex flex-col gap-1">
      <div
        class="text-base-content/60 flex items-center gap-1.5 text-xs font-medium"
      >
        <ScrollTextIcon class="size-3" />
        <span>Recent errors</span>
      </div>
      {#each recentErrors as error}
        <button
          onclick={() => onServiceClick(error.projectId)}
          class="group flex flex-col gap-0.5 rounded-lg bg-error/5 px-2 py-1 text-left transition-colors hover:bg-error/10"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-error">{error.projectName}</span>
            <span class="text-base-content/40 text-xs">
              {formatTimeAgo(error.log.createdAt)}
            </span>
          </div>
          <span class="text-base-content/60 truncate text-xs">
            {truncateMessage(error.log.message)}
          </span>
        </button>
      {/each}
    </div>
  {:else if loadingErrors && servicesWithLogging.length > 0}
    <div class="flex items-center gap-1.5">
      <span
        class="loading loading-spinner loading-xs text-base-content/40"
      ></span>
      <span class="text-base-content/40 text-xs">Loading errors...</span>
    </div>
  {/if}
</div>
