<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { userInvitationsState } from '$lib/domains/app/clusters/application/user-invitations.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import ClaimBanner from '$lib/domains/app/clusters/ui/ClaimBanner/ClaimBanner.svelte';
  import ClusterSidebar from '$lib/domains/app/clusters/ui/ClusterSidebar/ClusterSidebar.svelte';
  import SidebarContent from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarContent.svelte';
  import PendingInvitations from '$lib/domains/app/clusters/ui/PendingInvitations.svelte';
  import ServiceTabsNav from '$lib/domains/app/clusters/ui/ServiceTabsNav.svelte';
  import BottomSheet from '$lib/domains/shared/ui/components/BottomSheet/BottomSheet.svelte';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import LogoMark from '$lib/domains/shared/icons/LogoMark.svelte';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  const currentCluster = $derived(clustersState.get(page.params.cluster_id));
  const clusterColor = $derived(currentCluster?.color);
  const clusterName = $derived(currentCluster?.name || 'Projects');
  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);
  const pageTitle = $derived(titleFor(page.url.pathname));

  function titleFor(pathname: string): string | null {
    if (pathname.endsWith('/settings')) return 'Settings';
    if (pathname.includes('/status-pages')) return 'Status pages';
    if (pathname.endsWith('/new')) return 'New project';
    if (clusterId) return 'Overview';
    return null;
  }

  onMount(() => {
    const cleanup = userInvitationsState.startPollingInvitations();
    return () => cleanup();
  });
</script>

<div class="bg-base-300 flex h-dvh w-full flex-col lg:flex-row">
  <ClusterSidebar />

  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
    <header
      class="border-hairline flex h-12 shrink-0 items-center gap-4 border-b px-3 sm:px-4"
    >
      <div class="flex min-w-0 flex-1 items-center">
        {#if clusterId && projectId}
          <ServiceTabsNav {clusterId} {projectId} />
        {:else}
          <span class="flex min-w-0 items-center gap-2 px-1 text-sm">
            <span class="text-neutral-500 truncate">{clusterName}</span>
            {#if pageTitle}
              <span class="text-neutral-700">/</span>
              <span class="truncate font-medium">{pageTitle}</span>
            {/if}
          </span>
        {/if}
      </div>

      {#if userState.isAnonymous}
        <ClaimBanner />
      {/if}
    </header>

    <ScrollArea class="relative flex min-h-0 w-full flex-1 flex-col">
      <ResponsiveSkyBackground />
      <div
        class="relative mx-auto flex w-full max-w-5xl flex-col px-4 pt-6 pb-24 sm:px-8 lg:pt-8 lg:pb-12"
      >
        <PendingInvitations />
        {@render children()}
      </div>
    </ScrollArea>
  </div>
</div>

<BottomSheet {peekContent}>
  <SidebarContent showLogo={false} />
</BottomSheet>

{#snippet peekContent()}
  <div class="flex w-full items-center justify-between px-4 pr-5 py-1">
    <div class="flex items-center gap-3">
      {#if clusterColor}
        <div
          class="size-8 rounded-lg flex items-center justify-center"
          style="background-color: {clusterColor}20; border: 1px solid {clusterColor}10"
        >
          <CubeIcon class="size-5 shrink-0" style="color: {clusterColor}" />
        </div>
      {:else}
        <div
          class="size-6 rounded-md flex items-center justify-center bg-primary/15 border border-primary/5"
        >
          <CubeIcon class="size-4 shrink-0 text-primary" />
        </div>
      {/if}
      <span class="text-lg font-medium truncate max-w-52">{clusterName}</span>
    </div>

    <a
      href={resolve('/app/clusters')}
      class="flex items-center gap-2"
      onclick={(e) => e.stopPropagation()}
    >
      <LogoMark class="size-7" />
    </a>
  </div>
{/snippet}
