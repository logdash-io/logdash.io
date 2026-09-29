<script lang="ts">
  import { getStatusConfig } from '$lib/domains/app/projects/domain/monitoring/status-config.js';
  import {
    SERVICE_STATUS_DOT,
    type ServiceStatus,
  } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import CloudIcon from '$lib/domains/shared/icons/CloudIcon.svelte';
  import ServiceErrorsBadge from './ServiceErrorsBadge.svelte';

  type Props = {
    projectId: string;
    name: string;
    url: string | null;
    status: ServiceStatus;
    onclick: () => void;
  };

  const { projectId, name, url, status, onclick }: Props = $props();

  const statusConfig = $derived(getStatusConfig(status));
</script>

<button
  {onclick}
  class="ld-card-base group flex cursor-pointer flex-col justify-between gap-4 rounded-xl p-4 text-left hover:bg-neutral-800"
>
  <div class="flex flex-col gap-0.5">
    <div class="flex items-center gap-3">
      <CloudIcon class="text-neutral-400 size-4 shrink-0" />

      <h3 class="min-w-0 flex-1 truncate text-sm font-medium">{name}</h3>

      <span class="flex shrink-0 items-center gap-1.5 text-xs">
        <span
          class={['size-1.5 rounded-full', SERVICE_STATUS_DOT[status]]}
        ></span>
        <span class="text-neutral-400">{statusConfig.text}</span>
      </span>

      <ChevronRightIcon
        class="text-neutral-600 group-hover:text-neutral-400 size-3.5 shrink-0 transition-ink duration-150"
      />
    </div>

    {#if url}
      <p class="text-neutral-500 truncate pl-7 text-xs">{url}</p>
    {/if}
  </div>

  <div class="flex items-center gap-2">
    <ServiceErrorsBadge {projectId} />
  </div>
</button>
