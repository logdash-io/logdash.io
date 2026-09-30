<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { userInvitationsState } from '$lib/domains/app/clusters/application/user-invitations.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import { serviceEntries } from '$lib/domains/app/clusters/application/service-entries.js';
  import { domainLabel } from '$lib/domains/app/clusters/domain/service-groups.js';
  import ClaimBanner from '$lib/domains/app/clusters/ui/ClaimBanner/ClaimBanner.svelte';
  import ClusterSidebar from '$lib/domains/app/clusters/ui/ClusterSidebar/ClusterSidebar.svelte';
  import SidebarContent from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarContent.svelte';
  import PendingInvitations from '$lib/domains/app/clusters/ui/PendingInvitations.svelte';
  import ServiceTabsNav from '$lib/domains/app/clusters/ui/ServiceTabsNav.svelte';
  import LiveIndicator from './LiveIndicator.svelte';
  import TopBar from './TopBar.svelte';
  import BottomSheet from '$lib/domains/shared/ui/components/BottomSheet/BottomSheet.svelte';
  import GridIcon from '$lib/domains/shared/icons/GridIcon.svelte';
  import UserIcon from '$lib/domains/shared/icons/UserIcon.svelte';
  import ProjectTile from '$lib/domains/app/clusters/ui/ClusterSidebar/ProjectTile.svelte';
  import LogoMark from '$lib/domains/shared/icons/LogoMark.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
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
      serviceEntries(currentCluster).map((entry) => entry.url),
    ),
  );
  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);
  const clusterPath = $derived(
    clusterId ? (`/app/domains/${clusterId}` as const) : undefined,
  );
  const statusPageName = $derived(
    publicDashboardManagerState.getDashboard(page.params.status_page_id ?? '')
      ?.name,
  );
  const crumbs = $derived(crumbsFor(page.route.id));

  type Crumb = {
    label: string;
    path?: '/app/domains' | `/app/domains/${string}`;
  };

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
      .with('/app/domains/[cluster_id]', () => [domain, { label: 'Home' }])
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
      .otherwise(() => [{ label: clusterName }]);
  }

  onMount(() => {
    const cleanup = userInvitationsState.startPollingInvitations();
    return () => cleanup();
  });
</script>

<div class="bg-surface-root flex h-dvh w-full flex-col lg:flex-row">
  <ClusterSidebar />

  <div class="bg-surface-elevated flex min-h-0 min-w-0 flex-1 flex-col">
    <TopBar>
      <div class="flex min-w-0 flex-1 items-center">
        {#if clusterId && projectId}
          <ServiceTabsNav {clusterId} {projectId} />
          <LiveIndicator
            label={logsState.streamPaused ? 'Paused' : 'Live'}
            dot={logsState.streamPaused ? 'neutral' : 'success'}
          />
        {:else}
          <nav aria-label="Breadcrumb" class="min-w-0">
            <ol class="flex min-w-0 items-center gap-2 text-sm">
              {#each crumbs as crumb, index (index)}
                {@const isCurrent = index === crumbs.length - 1}
                <li class="flex min-w-0 items-center gap-2">
                  {#if index > 0}
                    <span class="text-neutral-700" aria-hidden="true">/</span>
                  {/if}
                  {#if crumb.path && !isCurrent}
                    <a
                      href={resolve(crumb.path)}
                      class="hover:text-fg-default transition-ink focus-visible:outline-brand -mx-1 -my-1 block truncate rounded-md px-1 py-1 text-neutral-500 focus-visible:outline-2"
                    >
                      {crumb.label}
                    </a>
                  {:else}
                    <span
                      class={[
                        'truncate',
                        isCurrent ? 'font-medium' : 'text-neutral-500',
                      ]}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      {crumb.label}
                    </span>
                  {/if}
                </li>
              {/each}
            </ol>
          </nav>
        {/if}
      </div>
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
  <SidebarContent showLogo={false} />
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
          class="bg-surface-150 flex size-8 shrink-0 items-center justify-center rounded-lg"
        >
          {#if isAccount}
            <UserIcon class="text-neutral-300 size-4" />
          {:else}
            <GridIcon class="text-neutral-300 size-4" />
          {/if}
        </span>
      {/if}
      <span class="flex max-w-52 min-w-0 flex-col text-left">
        <span class="truncate text-lg leading-tight font-medium">
          {clusterName}
        </span>
        {#if clusterDomain}
          <span class="text-neutral-500 truncate text-xs">{clusterDomain}</span>
        {/if}
      </span>
    </div>

    <LogoMark class="size-7 shrink-0" />
  </div>
{/snippet}
