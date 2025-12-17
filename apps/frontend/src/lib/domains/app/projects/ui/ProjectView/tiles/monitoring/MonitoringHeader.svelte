<script lang="ts">
  import { StatusBadge } from '@logdash/hyper-ui/features';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import { getStatusConfig } from '$lib/domains/app/projects/domain/monitoring/status-config.js';

  type Props = {
    name: string;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    showArrow?: boolean;
  };

  const { name, status, showArrow = false }: Props = $props();

  const statusConfig = $derived(getStatusConfig(status));
</script>

<div class="flex w-full items-center justify-between">
  <div class="flex items-center gap-3">
    <StatusBadge {status} />

    <div>
      <h4 class="text-secondary text-lg font-medium">
        {name}
      </h4>
    </div>
  </div>

  <div class="flex items-center gap-2 text-right">
    <div class={['text-sm font-medium', statusConfig.color]}>
      {statusConfig.text}
    </div>

    {#if showArrow}
      <ChevronRightIcon
        class="size-4 text-base-content/30 group-hover:text-base-content"
      />
    {/if}
  </div>
</div>
