<script lang="ts">
  import ClusterNav from './ClusterNav.svelte';
  import ResponsiveSkyBackground from '$lib/shared/upgrade/ResponsiveSkyBackground.svelte';
  import ClusterManageTeamModal from './ClusterManageTeamModal.svelte';
  import PendingInvitations from '../PendingInvitations.svelte';
  import { clusterInvitesState } from '../../application/cluster-invites.state.svelte.js';
  import { userInvitationsState } from '../../application/user-invitations.state.svelte.js';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  onMount(() => {
    const cleanup = userInvitationsState.startPollingInvitations();

    return () => cleanup();
  });
</script>

<div class="relative mx-auto flex h-full w-full flex-col gap-4 p-4 pt-0 lg:p-0">
  <ResponsiveSkyBackground />
  <ClusterNav />
  <div class="mx-auto flex h-full max-h-full w-full xl:w-7xl">
    <div class="relative flex h-full w-full flex-col items-center">
      <PendingInvitations />
      {@render children()}
    </div>
  </div>
</div>

{#if clusterInvitesState.currentClusterId}
  <ClusterManageTeamModal
    clusterId={clusterInvitesState.currentClusterId}
    isOpen={clusterInvitesState.isModalOpen}
    onClose={() => clusterInvitesState.closeModal()}
  />
{/if}
