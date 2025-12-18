<script lang="ts">
  import MetricsSetup from '$lib/domains/app/projects/ui/setup/MetricsSetup.svelte';
  import ProjectClaimer from '$lib/domains/shared/ui/setup/ProjectClaimer.svelte';
  import { page } from '$app/state';

  type Props = {
    data: { project_id: string; api_key: string };
  };
  const { data }: Props = $props();
  const clusterId = $derived(page.params.cluster_id);
</script>

{#snippet claimer(hasLogs: boolean)}
  <ProjectClaimer
    nextUrl={`/app/clusters/${clusterId}/${data.project_id}`}
    canClaim={hasLogs}
  />
{/snippet}

<MetricsSetup {claimer} {...data} {clusterId} />
