<script lang="ts">
  import LoggingSetup from '$lib/domains/app/projects/ui/setup/LoggingSetup.svelte';
  import ProjectClaimer from '$lib/domains/app/projects/ui/setup/ProjectClaimer.svelte';
  import { page } from '$app/state';

  type Props = {
    data: { project_id: string; api_key: string };
  };
  const { data }: Props = $props();
</script>

{#snippet claimer(hasLogs: boolean)}
  <ProjectClaimer
    nextUrl={`/app/clusters/${page.params.cluster_id}?project_id=${data.project_id}`}
    canClaim={hasLogs}
  />
{/snippet}

<LoggingSetup {claimer} {...data} />
