<script lang="ts">
  import { resolve } from '$app/paths';
  import { domainLiveState } from '$lib/domains/app/clusters/application/domain-live.state.svelte.js';
  import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
  import ProjectTile from '$lib/domains/app/clusters/ui/ClusterSidebar/ProjectTile.svelte';
  import { formatCount } from '$lib/domains/web-analytics/domain/analytics-format.js';
  import type { DomainVisitors } from './domain-visitors';
  import VisitorsSparkline from './VisitorsSparkline.svelte';

  type Props = {
    cluster: Cluster;
    visitors: DomainVisitors;
    down: number;
  };

  const { cluster, visitors, down }: Props = $props();

  const online = $derived(domainLiveState.online(cluster.id));
</script>

<a
  href={resolve('/app/domains/[cluster_id]', { cluster_id: cluster.id })}
  class="bg-surface-25-bg hover:bg-surface-25-hover-bg focus-visible:outline-brand flex w-full min-w-0 flex-col gap-2 rounded-2xl p-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
>
  <div class="flex h-7 min-w-0 items-center gap-2.5 px-3">
    <ProjectTile
      name={cluster.name}
      color={cluster.color}
      class="size-5 rounded-md text-[11px]"
    />

    <span class="min-w-0 truncate text-[13px] font-medium">{cluster.name}</span>

    {#if down}
      <span
        class="text-error ml-auto flex shrink-0 items-center gap-1.5 text-xs"
      >
        <span class="bg-error size-1.5 rounded-full"></span>
        {down} down
      </span>
    {:else if online}
      <span
        class="text-fg-tertiary ml-auto flex shrink-0 items-center gap-1.5 text-xs tabular-nums"
      >
        <span class="bg-success size-1.5 rounded-full"></span>
        {online} online
      </span>
    {/if}
  </div>

  <div class="flex min-w-0 flex-col gap-3 p-3">
    <div class="flex flex-col gap-1.5">
      <span class="text-fg-muted text-xs">Visitors</span>
      <span class="flex h-8 items-center font-mono text-2xl tabular-nums">
        {#if visitors.status === 'ready'}
          {formatCount(visitors.overview.visitors)}
        {:else if visitors.status === 'error'}
          <span class="text-fg-muted font-sans text-sm">
            Could not load visitors
          </span>
        {:else}
          <span class="bg-surface-150-bg h-8 w-16 rounded-md"></span>
        {/if}
      </span>
    </div>

    {#if visitors.status === 'loading'}
      <div class="bg-surface-150-bg h-16 rounded-lg"></div>
    {:else}
      <VisitorsSparkline
        values={visitors.status === 'ready'
          ? visitors.overview.series.map((point) => point.visitors)
          : []}
      />
    {/if}
  </div>
</a>
