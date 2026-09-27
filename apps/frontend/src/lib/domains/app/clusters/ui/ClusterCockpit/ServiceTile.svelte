<script lang="ts">
  import { getStatusConfig } from '$lib/domains/app/projects/domain/monitoring/status-config.js';
  import type { ServiceStatus } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import HexagonIcon from '$lib/domains/shared/icons/HexagonIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import ServiceErrorsBadge from './ServiceErrorsBadge.svelte';

  type Props = {
    projectId: string;
    name: string;
    status: ServiceStatus;
    onclick: () => void;
  };

  const { projectId, name, status, onclick }: Props = $props();

  const STATUS_DOT: Record<ServiceStatus, string> = {
    up: 'bg-success',
    down: 'bg-error',
    degraded: 'bg-warning',
    unknown: 'bg-neutral-600',
  };

  const statusConfig = $derived(getStatusConfig(status));
</script>

<button
  {onclick}
  class="ld-card-base group flex cursor-pointer flex-col gap-4 rounded-xl p-4 text-left hover:bg-neutral-800"
>
  <div class="flex items-center gap-3">
    <HexagonIcon class="text-neutral-400 size-4 shrink-0" />

    <h3 class="min-w-0 flex-1 truncate text-sm font-medium">{name}</h3>

    <span class="flex shrink-0 items-center gap-1.5 text-xs">
      <span class={['size-1.5 rounded-full', STATUS_DOT[status]]}></span>
      <span class="text-neutral-400">{statusConfig.text}</span>
    </span>

    <ChevronRightIcon
      class="text-neutral-600 group-hover:text-neutral-400 size-3.5 shrink-0 transition-ink duration-150"
    />
  </div>

  <div class="flex items-center gap-2">
    <ServiceErrorsBadge {projectId} />
  </div>
</button>
