<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import SidebarAccountRow from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarAccountRow.svelte';
  import SidebarDomainNav from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarDomainNav.svelte';
  import SidebarDomainRow from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarDomainRow.svelte';
  import SidebarLayout from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarLayout.svelte';
  import SidebarNewServiceRow from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarNewServiceRow.svelte';
  import SidebarServiceRow from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarServiceRow.svelte';
  import LiveIndicator from '$lib/domains/app/clusters/ui/ClusterShell/LiveIndicator.svelte';
  import TopBar from '$lib/domains/app/clusters/ui/ClusterShell/TopBar.svelte';
  import ServiceTabs from '$lib/domains/app/clusters/ui/ServiceTabs.svelte';
  import { SERVICE_TAB_ITEMS } from '$lib/domains/app/clusters/ui/service-tabs';
  import MetricsColumn from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsColumn.svelte';
  import LogsToolbar from '$lib/domains/logs/ui/logs-tile/header/LogsToolbar.svelte';
  import LogRow from '$lib/domains/logs/ui/logs-tile/log-row/LogRow.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import LoadingLine from '$lib/domains/shared/ui/components/LoadingLine.svelte';
  import RollingFeed from '$lib/landing/RollingFeed.svelte';
  import type { Snippet } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { blur } from 'svelte/transition';
  import HeroMonitor from './HeroMonitor.svelte';
  import {
    heroLive,
    heroLogRows,
    heroMetrics,
    heroService,
    type HeroLogRow,
  } from './hero-dashboard';
  import {
    showcaseClusterName,
    showcaseSwap,
    showsVisitorAccount,
  } from './hero-showcase';
  import TypewriterText from './TypewriterText.svelte';

  type Props = {
    fit: boolean;
    covered: boolean;
    toggle: Snippet;
  };

  const { fit, covered, toggle }: Props = $props();

  const TABS = SERVICE_TAB_ITEMS.map((tab) => ({
    ...tab,
    active: tab.id === 'overview',
  }));
  const LOG_ROWS = 6;
  const ROW_PX = 28;
  const FEED_GAP_PX = 8;
  const MIN_ROWS = 3;
  const LOGS_SWAP_DELAY_MS = 100;
  const METRICS_SWAP_DELAY_MS = 150;
  const DOMAIN_SWAP_MS = 240;
  const DOMAIN_SWAP_BLUR_PX = 4;

  let listHeight = $state(0);

  const phase = $derived(anonymousPreviewState.phase);
  const visitor = $derived(showsVisitorAccount(phase));
  const domainName = $derived(
    showcaseClusterName(phase, anonymousPreviewState.clusterName),
  );
  const service = $derived(
    heroService({
      phase,
      previewHost: anonymousPreviewState.previewHost,
      hasPreview: anonymousPreviewState.preview !== null,
      pings: anonymousPreviewState.pings,
      demo: anonymousPreviewState.demo,
    }),
  );
  const live = $derived(heroLive(phase));
  const logs = $derived(anonymousPreviewState.demo.logs);
  const tail = $derived(heroLogRows(logs ?? []));
  const visibleRows = $derived(
    fit && listHeight > 0
      ? Math.max(MIN_ROWS, Math.floor((listHeight + FEED_GAP_PX) / ROW_PX))
      : LOG_ROWS,
  );
  const metrics = $derived(
    visitor ? [] : heroMetrics(anonymousPreviewState.demo.metrics),
  );
  const metricsLoading = $derived(
    !visitor && anonymousPreviewState.demo.metrics === null,
  );
  const tracked = $derived(
    visitor ? 0 : anonymousPreviewState.demo.metricsTracked,
  );
</script>

<aside
  class="border-hairline bg-surface-root hidden w-64 shrink-0 flex-col border-r pt-1.5 lg:flex"
  aria-hidden="true"
  inert
>
  <SidebarLayout showLogo={false}>
    <SidebarDomainRow name={domainName} expanded={true}>
      {#key domainName}
        <span
          class="truncate"
          in:blur={{
            duration: DOMAIN_SWAP_MS,
            easing: cubicOut,
            amount: prefersReducedMotion.current ? 0 : DOMAIN_SWAP_BLUR_PX,
          }}
        >
          {domainName}
        </span>
      {/key}
    </SidebarDomainRow>

    <SidebarDomainNav />

    <SidebarServiceRow
      label={service.name}
      status={service.status}
      pending={service.pending}
      active={true}
    >
      <TypewriterText text={service.name} />
    </SidebarServiceRow>

    <SidebarNewServiceRow />

    {#snippet footer()}
      <SidebarAccountRow name="Anonymous" plan="Free" />
    {/snippet}
  </SidebarLayout>
</aside>

<div class="flex min-w-0 flex-1 flex-col" inert={covered}>
  <TopBar>
    <div class="flex min-w-0 flex-1 items-center">
      <div
        class="flex min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,black_calc(100%_-_1.5rem),transparent)]"
        aria-hidden="true"
      >
        <ServiceTabs tabs={TABS} />
      </div>

      <LiveIndicator label={live.label} dot={live.dot} pending={live.pending} />
    </div>

    {@render toggle()}
  </TopBar>

  <div class="flex min-h-0 flex-1">
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div class="border-hairline shrink-0 border-b">
        <HeroMonitor />
      </div>

      <div class="flex min-h-0 flex-1 flex-col">
        <div class="shrink-0 p-4">
          <LogsToolbar interactive={false} />
        </div>

        <div
          class="min-h-0 flex-1 overflow-hidden px-4 pb-4 lg:pb-0"
          bind:clientHeight={listHeight}
        >
          {#if visitor}
            <div in:showcaseSwap={{ delay: LOGS_SWAP_DELAY_MS }}>
              <EmptyState
                title="No logs yet"
                description="Your app's logs land here once you add the SDK."
              />
            </div>
          {:else if logs}
            <RollingFeed items={tail} visible={visibleRows}>
              {#snippet row(log: HeroLogRow)}
                <LogRow
                  prefix="short"
                  date={log.at}
                  level={log.level}
                  message={log.message}
                />
              {/snippet}
            </RollingFeed>
          {:else}
            <LoadingLine label="Loading logs" />
          {/if}
        </div>
      </div>
    </div>

    <div
      class="border-hairline hidden w-64 shrink-0 overflow-hidden border-l lg:flex xl:w-72"
      aria-hidden="true"
    >
      {#key visitor}
        <div
          class="flex w-full"
          in:showcaseSwap={{ delay: METRICS_SWAP_DELAY_MS }}
        >
          <MetricsColumn {metrics} {tracked} loading={metricsLoading} />
        </div>
      {/key}
    </div>
  </div>
</div>
