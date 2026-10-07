<script lang="ts">
  import { resolve } from '$app/paths';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import type { PingBucketPeriod } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import {
    TOOLBAR_GROUP,
    TOOLBAR_GROUP_OPTION,
    TOOLBAR_PRIMARY,
  } from '$lib/domains/shared/ui/components/toolbar.js';

  type Props = { clusterId: string; add?: boolean };

  const { clusterId, add = true }: Props = $props();

  const RANGES: { value: PingBucketPeriod; label: string }[] = [
    { value: '90h', label: '90 hours' },
    { value: '90d', label: '90 days' },
  ];
</script>

<div class="flex flex-wrap items-center gap-2">
  <div class={TOOLBAR_GROUP} role="radiogroup" aria-label="Uptime range">
    {#each RANGES as range (range.value)}
      {@const selected = monitoringState.timeRange === range.value}
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        class={[
          TOOLBAR_GROUP_OPTION,
          selected
            ? 'bg-surface-150-bg text-fg-default'
            : 'text-fg-tertiary hover:text-fg-default',
        ]}
        onclick={() => monitoringState.setTimeRange(range.value)}
      >
        {range.label}
      </button>
    {/each}
  </div>

  {#if add}
    <a
      href={resolve('/app/domains/[cluster_id]/uptime/new', {
        cluster_id: clusterId,
      })}
      class={TOOLBAR_PRIMARY}
    >
      <PlusIcon class="size-4" />
      Add monitor
    </a>
  {/if}
</div>
