<script lang="ts">
  import { page } from '$app/state';
  import { Feature } from '$lib/domains/shared/types.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import LogsTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
  import LoggingSetupOverlay from '$lib/domains/logs/ui/setup/LoggingSetupOverlay.svelte';

  const projectId = $derived(page.params.project_id);

  const hasLogging = $derived(
    projectsState.hasConfiguredFeature(projectId, Feature.LOGGING) ||
      logsState.logs.length > 0,
  );
</script>

<ProjectSync>
  <div class="flex w-full flex-1 flex-col gap-4 overflow-hidden">
    <DataTile
      delayIn={0}
      delayOut={50}
      class={[
        'relative overflow-hidden ld-card-rounding p-0',
        {
          'pt-3': hasLogging,
        },
      ]}
    >
      <LogsTile />
      {#if !hasLogging && projectsState.ready}
        <LoggingSetupOverlay {projectId} />
      {/if}
    </DataTile>
  </div>
</ProjectSync>
