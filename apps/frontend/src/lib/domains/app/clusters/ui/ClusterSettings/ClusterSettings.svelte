<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import TeamManagementCard from './TeamManagementCard.svelte';
  import ProjectInfoCard from './ProjectInfoCard.svelte';
  import DangerZoneCard from './DangerZoneCard.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const isCreator = $derived(
    clustersState.isUserClusterCreator(userState.id, clusterId),
  );
</script>

<div class="flex w-full justify-center">
  <div class="flex w-full max-w-2xl flex-col gap-6">
    {#if isCreator}
      <TeamManagementCard {clusterId} />
    {/if}

    <ProjectInfoCard {clusterId} />

    {#if isCreator}
      <DangerZoneCard {clusterId} />
    {/if}
  </div>
</div>
