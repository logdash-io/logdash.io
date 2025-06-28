<script lang="ts">
  import ClusterNav from './ClusterNav.svelte';
  import ResponsiveSkyBackground from '$lib/shared/upgrade/ResponsiveSkyBackground.svelte';
  import ClusterInvitesModal from './ClusterInvitesModal.svelte';
  import { clusterInvitesState } from '../../application/cluster-invites.state.svelte.js';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();
</script>

<div class="relative mx-auto flex h-full w-full flex-col gap-4 p-4 pt-0 lg:p-0">
  <ResponsiveSkyBackground />
  <ClusterNav />
  <div class="mx-auto flex h-full max-h-full w-full xl:w-7xl">
    <div class="relative flex h-full w-full flex-col items-center">
      {@render children()}
    </div>
  </div>
</div>

{#if clusterInvitesState.currentClusterId}
  <ClusterInvitesModal
    clusterId={clusterInvitesState.currentClusterId}
    isOpen={clusterInvitesState.isModalOpen}
    onClose={() => clusterInvitesState.closeModal()}
  />
{/if}
