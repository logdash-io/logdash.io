<script lang="ts">
  import { page } from '$app/state';
  import { Feature } from '$lib/domains/shared/types.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import LogsListTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
  import EmptyState from '$lib/domains/app/projects/ui/ProjectView/EmptyState.svelte';

  const projectId = $derived(page.params.project_id);

  const hasLogging = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );
</script>

<ProjectSync>
  {#if hasLogging && projectsState.ready}
    <div class="flex w-full flex-1 flex-col gap-4 overflow-hidden">
      <DataTile
        delayIn={0}
        delayOut={50}
        class="overflow-hidden ld-card-rounding p-0 pt-4"
      >
        <LogsListTile />
      </DataTile>
    </div>
  {:else if projectsState.ready}
    <EmptyState />
  {/if}
</ProjectSync>
