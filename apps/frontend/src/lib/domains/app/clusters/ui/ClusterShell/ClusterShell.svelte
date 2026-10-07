<script lang="ts">
  import { page } from '$app/state';
  import { userInvitationsState } from '$lib/domains/app/clusters/application/user-invitations.state.svelte.js';
  import { clusterHealthState } from '$lib/domains/app/clusters/application/cluster-health.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { domainLiveState } from '$lib/domains/app/clusters/application/domain-live.state.svelte.js';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import { domainLabel } from '$lib/domains/app/clusters/domain/service-groups.js';
  import ClaimBanner from '$lib/domains/app/clusters/ui/ClaimBanner/ClaimBanner.svelte';
  import ClusterSidebar from '$lib/domains/app/clusters/ui/ClusterSidebar/ClusterSidebar.svelte';
  import SidebarContent from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarContent.svelte';
  import PendingInvitations from '$lib/domains/app/clusters/ui/PendingInvitations.svelte';
  import ServiceTabsNav from '$lib/domains/app/clusters/ui/ServiceTabsNav.svelte';
  import Breadcrumbs, { type Crumb } from './Breadcrumbs.svelte';
  import LiveIndicator from './LiveIndicator.svelte';
  import TopBar from './TopBar.svelte';
  import BottomSheet from '$lib/domains/shared/ui/components/BottomSheet/BottomSheet.svelte';
  import GridIcon from '$lib/domains/shared/icons/GridIcon.svelte';
  import UserIcon from '$lib/domains/shared/icons/UserIcon.svelte';
  import ProjectTile from '$lib/domains/app/clusters/ui/ClusterSidebar/ProjectTile.svelte';
  import LogoMark from '$lib/domains/shared/icons/LogoMark.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import { onMount, untrack } from 'svelte';
  import { match } from 'ts-pattern';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  const currentCluster = $derived(clustersState.get(page.params.cluster_id));
  const clusterColor = $derived(currentCluster?.color);
  const isAccount = $derived(page.url.pathname.startsWith('/app/account'));
  const clusterName = $derived(
    currentCluster?.name || (isAccount ? 'Account' : 'Domains'),
  );
  const clusterDomain = $derived(
    domainLabel(
      clusterName,
      monitoringState
        .monitorsOf(page.params.cluster_id ?? '')
        .map((monitor) => monitor.url),
    ),
  );
  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);
  const clusterPath = $derived(
    clusterId ? (`/app/domains/${clusterId}` as const) : undefined,
  );
  const serviceName = $derived(
    currentCluster?.projects?.find(({ id }) => id === projectId)?.name,
  );
  const statusPageName = $derived(
    publicDashboardManagerState.getDashboard(page.params.status_page_id ?? '')
      ?.name,
  );
  const monitorName = $derived(
    monitoringState.getMonitorById(page.params.monitor_id ?? '')?.name,
  );
  const showLive = $derived(
    page.route.id === '/app/domains/[cluster_id]/[project_id]' ||
      page.route.id === '/app/domains/[cluster_id]/[project_id]/logs',
  );
  const crumbs = $derived(crumbsFor(page.route.id));
  const clusterIds = $derived(
    clustersState.clusters.map(({ id }) => id).join(','),
  );

  function crumbsFor(routeId: string | null): Crumb[] {
    const domain = { label: clusterName, path: clusterPath };

    return match<string | null, Crumb[]>(routeId)
      .with('/app/domains/new', () => [
        { label: clusterName, path: '/app/domains' },
        { label: 'Add domain' },
      ])
      .with('/app/account/api-keys', () => [
        { label: clusterName },
        { label: 'API keys' },
      ])
      .with('/app/domains/[cluster_id]', () => [domain, { label: 'Analytics' }])
      .with('/app/domains/[cluster_id]/events/[event_name]', () => [
        domain,
        {
          label: 'Analytics',
          path: clusterPath && `${clusterPath}${page.url.search}`,
        },
        { label: page.params.event_name ?? 'Event' },
      ])
      .with('/app/domains/[cluster_id]/services', () => [
        domain,
        { label: 'Services' },
      ])
      .with('/app/domains/[cluster_id]/uptime', () => [
        domain,
        { label: 'Uptime' },
      ])
      .with('/app/domains/[cluster_id]/uptime/new', () => [
        domain,
        { label: 'Uptime', path: clusterPath && `${clusterPath}/uptime` },
        { label: 'Add monitor' },
      ])
      .with('/app/domains/[cluster_id]/uptime/[monitor_id]', () => [
        domain,
        { label: 'Uptime', path: clusterPath && `${clusterPath}/uptime` },
        ...(monitorName ? [{ label: monitorName }] : []),
      ])
      .with('/app/domains/[cluster_id]/settings', () => [
        domain,
        { label: 'Settings' },
      ])
      .with('/app/domains/[cluster_id]/status-pages', () => [
        domain,
        { label: 'Status pages' },
      ])
      .with('/app/domains/[cluster_id]/status-pages/[status_page_id]', () => [
        domain,
        {
          label: 'Status pages',
          path: clusterPath && `${clusterPath}/status-pages`,
        },
        ...(statusPageName ? [{ label: statusPageName }] : []),
      ])
      .when(
        (id) => id?.startsWith('/app/domains/[cluster_id]/[project_id]'),
        () => [
          domain,
          {
            label: 'Services',
            path: clusterPath && `${clusterPath}/services`,
          },
          { label: serviceName ?? 'Service' },
        ],
      )
      .otherwise(() => [{ label: clusterName }]);
  }

  onMount(() => {
    const cleanup = userInvitationsState.startPollingInvitations();
    return () => cleanup();
  });

  $effect(() => {
    const ids = clusterIds ? clusterIds.split(',') : [];

    return untrack(() => {
      const stopLive = domainLiveState.startPolling(ids);
      const stopHealth = clusterHealthState.startPolling(ids);

      return () => {
        stopLive();
        stopHealth();
      };
    });
  });
</script>

<div
  data-app-shell
  class="bg-surface-root-bg max-lg:bg-surface-50-bg flex h-dvh w-full flex-col tracking-normal lg:flex-row"
>
  <ClusterSidebar />

  <div
    class="bg-surface-50-bg lg:edge-over flex min-h-0 min-w-0 flex-1 flex-col lg:my-2 lg:mr-2 lg:overflow-hidden lg:rounded-xl"
  >
    <TopBar>
      <div class="flex min-w-0 flex-1 items-center">
        <Breadcrumbs {crumbs} />
      </div>

      {#if clusterId && projectId}
        <div class="flex min-w-0 items-center gap-3 max-sm:w-full">
          {#if showLive}
            <LiveIndicator
              label={logsState.streamPaused ? 'Paused' : 'Live'}
              dot={logsState.streamPaused ? 'neutral' : 'success'}
            />
          {/if}
          <ServiceTabsNav {clusterId} {projectId} />
        </div>
      {/if}

      {#if topBarState.actions}
        <div class="flex min-w-0 items-center gap-2 max-sm:w-full">
          {@render topBarState.actions()}
        </div>
      {/if}
    </TopBar>

    <ScrollArea class="relative flex min-h-0 w-full flex-1 flex-col">
      <div class="flex min-h-full flex-col">
        <div
          class={[
            'relative flex w-full flex-1 flex-col',
            { 'max-lg:pb-24': !userState.isAnonymous },
          ]}
        >
          <PendingInvitations />
          {@render children()}
        </div>

        {#if userState.isAnonymous}
          <ClaimBanner />
        {/if}
      </div>
    </ScrollArea>
  </div>
</div>

<BottomSheet {peekContent}>
  <SidebarContent />
</BottomSheet>

{#snippet peekContent()}
  <div class="flex w-full items-center justify-between px-4 pr-5 py-1">
    <div class="flex min-w-0 items-center gap-3">
      {#if currentCluster}
        <ProjectTile
          name={currentCluster.name}
          color={clusterColor}
          class="size-8 rounded-lg text-sm"
        />
      {:else}
        <span
          class="bg-surface-200-bg flex size-8 shrink-0 items-center justify-center rounded-lg"
        >
          {#if isAccount}
            <UserIcon class="text-fg-secondary size-4" />
          {:else}
            <GridIcon class="text-fg-secondary size-4" />
          {/if}
        </span>
      {/if}
      <span class="flex max-w-52 min-w-0 flex-col text-left">
        <span class="truncate text-lg leading-tight font-medium">
          {clusterName}
        </span>
        {#if clusterDomain}
          <span class="text-fg-muted truncate text-xs">{clusterDomain}</span>
        {/if}
      </span>
    </div>

    <LogoMark class="size-7 shrink-0" />
  </div>
{/snippet}
