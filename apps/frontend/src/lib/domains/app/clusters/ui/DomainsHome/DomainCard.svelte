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
  class="bg-surface-100-bg edge hover:bg-surface-100-hover-bg focus-visible:outline-brand flex w-full flex-col rounded-xl p-5 focus-visible:outline-2 focus-visible:-outline-offset-2"
>
  <div class="flex min-w-0 items-center gap-2.5">
    <ProjectTile
      name={cluster.name}
      color={cluster.color}
      class="size-5 rounded-md text-[11px]"
    />

    <span class="min-w-0 truncate font-medium">{cluster.name}</span>

    {#if down}
      <span
        class="text-error ml-auto flex shrink-0 items-center gap-1.5 text-xs"
      >
        <span class="bg-error size-1.5 rounded-full"></span>
        {down} down
      </span>
    {:else if online}
      <span
        class="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-fg-tertiary tabular-nums"
      >
        <span class="bg-success size-1.5 rounded-full"></span>
        {online} online
      </span>
    {/if}
  </div>

  <div class="mt-4 flex flex-col gap-3 pl-7.5">
    {#if visitors.status === 'ready'}
      <VisitorsSparkline
        values={visitors.overview.series.map((point) => point.visitors)}
      />
      <span class="text-fg-tertiary text-sm">
        <span class="text-fg-default font-mono tabular-nums">
          {formatCount(visitors.overview.visitors)}
        </span>
        {visitors.overview.visitors === 1 ? 'visitor' : 'visitors'}
      </span>
    {:else if visitors.status === 'error'}
      <VisitorsSparkline values={[]} />
      <span class="text-fg-muted text-sm">Could not load visitors</span>
    {:else}
      <div class="bg-surface-150-bg h-20 rounded-lg"></div>
      <span class="flex h-5 items-center">
        <span class="bg-surface-150-bg h-3.5 w-20 rounded"></span>
      </span>
    {/if}
  </div>
</a>
