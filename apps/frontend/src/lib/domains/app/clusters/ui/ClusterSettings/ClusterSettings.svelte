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
    userState.id
      ? clustersState.isUserClusterCreator(userState.id, clusterId)
      : false,
  );
</script>

<div class="flex w-full flex-col">
  <ProjectInfoCard {clusterId} canEdit={isCreator} />

  {#if isCreator}
    <TeamManagementCard {clusterId} />
    <DangerZoneCard {clusterId} />
  {/if}
</div>
