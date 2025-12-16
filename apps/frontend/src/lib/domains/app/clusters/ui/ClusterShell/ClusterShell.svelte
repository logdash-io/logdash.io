<script lang="ts">
  import ClusterNav from '$lib/domains/app/clusters/ui/ClusterShell/ClusterNav.svelte';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
  import ClusterManageTeamModal from '$lib/domains/app/clusters/ui/ClusterShell/ClusterManageTeamModal.svelte';
  import PendingInvitations from '$lib/domains/app/clusters/ui/PendingInvitations.svelte';
  import { clusterInvitesState } from '$lib/domains/app/clusters/application/cluster-invites.state.svelte.js';
  import { userInvitationsState } from '$lib/domains/app/clusters/application/user-invitations.state.svelte.js';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import ClusterSidebar from '$lib/domains/app/clusters/ui/ClusterSidebar/ClusterSidebar.svelte';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  onMount(() => {
    const cleanup = userInvitationsState.startPollingInvitations();
    return () => cleanup();
  });
</script>

<div class="w-full h-dvh flex">
  <ClusterSidebar />

  <ScrollArea
    class="relative mx-auto flex h-full w-full flex-col gap-4 p-4 pt-0 lg:p-0"
  >
    <ResponsiveSkyBackground />
    <div class="mx-auto flex h-full max-h-full w-full xl:w-7xl">
      <div class="relative flex h-full w-full flex-col items-center">
        <PendingInvitations />
        {@render children()}
      </div>
    </div>
  </ScrollArea>
</div>

{#if clusterInvitesState.currentClusterId}
  <ClusterManageTeamModal
    clusterId={clusterInvitesState.currentClusterId}
    isOpen={clusterInvitesState.isModalOpen}
    onClose={() => clusterInvitesState.closeModal()}
  />
{/if}
