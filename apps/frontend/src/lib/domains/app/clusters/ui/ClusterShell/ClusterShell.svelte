<script lang="ts">
  import { page } from '$app/state';
  import { userInvitationsState } from '$lib/domains/app/clusters/application/user-invitations.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import ClusterSidebar from '$lib/domains/app/clusters/ui/ClusterSidebar/ClusterSidebar.svelte';
  import SidebarContent from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarContent.svelte';
  import PendingInvitations from '$lib/domains/app/clusters/ui/PendingInvitations.svelte';
  import BottomSheet from '$lib/domains/shared/ui/components/BottomSheet/BottomSheet.svelte';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
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

  onMount(() => {
    const cleanup = userInvitationsState.startPollingInvitations();
    return () => cleanup();
  });
</script>

<div class="w-full h-dvh flex flex-col lg:flex-row">
  <ClusterSidebar />

  <ScrollArea class="relative mx-auto flex h-full w-full flex-col">
    <ResponsiveSkyBackground />
    <div class="mx-auto flex h-full max-h-full w-full max-w-4xl">
      <div
        class="relative flex h-full w-full flex-col items-center p-1 pb-20 md:p-2 md:px-4 lg:pb-2"
      >
        <PendingInvitations />
        {@render children()}
      </div>
    </div>
  </ScrollArea>
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
      <span class="text-lg font-medium truncate max-w-32">{clusterName}</span>
    </div>

    <a
      href="/app/clusters"
      class="flex items-center gap-2"
      onclick={(e) => e.stopPropagation()}
    >
      <Logo class="size-8" />
    </a>
  </div>
{/snippet}
