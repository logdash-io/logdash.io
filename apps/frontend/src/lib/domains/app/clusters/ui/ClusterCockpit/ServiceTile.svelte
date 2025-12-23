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

  const statusConfig = $derived(getStatusConfig(status));
</script>

<button
  {onclick}
  class="ld-card-base group flex cursor-pointer flex-col gap-3 ld-card-rounding p-4 transition-all hover:bg-base-100/50"
>
  <div class="flex items-start justify-between">
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <div
        class={[
          'flex h-10 w-10 items-center justify-center rounded-xl',
          {
            'bg-success/10': status === 'up',
            'bg-error/10': status === 'down',
            'bg-warning/10': status === 'degraded',
            'bg-base-100': status === 'unknown',
          },
        ]}
      >
        <HexagonIcon
          class={[
            'size-5',
            {
              'text-success': status === 'up',
              'text-error': status === 'down',
              'text-warning': status === 'degraded',
              'text-base-content/50': status === 'unknown',
            },
          ]}
        />
      </div>
      <div class="flex flex-col items-start min-w-0 flex-1">
        <h3 class="font-semibold truncate max-w-full">{name}</h3>
        <span class={['text-xs', statusConfig.color]}>
          {statusConfig.text}
        </span>
      </div>
    </div>
    <ChevronRightIcon
      class="size-4 text-base-content/30 transition-transform group-hover:translate-x-0.5 group-hover:text-base-content"
    />
  </div>

  <div class="flex items-center gap-2">
    <ServiceErrorsBadge {projectId} />
  </div>
</button>
