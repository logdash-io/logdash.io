<script lang="ts">
  import { page } from '$app/state';
  import ProjectClaimer from '$lib/domains/shared/ui/setup/ProjectClaimer.svelte';
  import MonitoringSetup from '$lib/domains/app/projects/ui/setup/MonitoringSetup.svelte';

  type Props = {
    data: { project_id: string; api_key: string };
  };
  const { data }: Props = $props();
  let monitorId = $state<string | undefined>();
</script>

{#snippet claimer(hasLogs: boolean)}
  <ProjectClaimer
    nextUrl={monitorId
      ? `/app/api/clusters/${page.params.cluster_id}/monitors/claim?project_id=${data.project_id}&monitor_id=${monitorId}`
      : ''}
    canClaim={hasLogs && !!monitorId}
  />
{/snippet}

<MonitoringSetup
  {claimer}
  {...data}
  onMonitorCreated={(id) => (monitorId = id)}
/>
