<script lang="ts">
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import MetricDetails from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricDetails.svelte';
  import UnifiedSetupOverlay from '$lib/domains/app/projects/ui/setup/UnifiedSetupOverlay.svelte';

  const projectId = $derived(page.params.project_id);
</script>

<ProjectSync>
  <div class="relative flex w-full max-w-full flex-col gap-1.5 md:flex-row">
    <div class="flex flex-1 flex-col gap-1.5 md:sticky md:top-4 md:self-start">
      <MetricDetails />
    </div>

    <div class="w-full shrink-0 sm:w-80">
      <MetricsTiles />
    </div>

    {#if metricsState.isUsingFakeData && projectsState.ready && metricsState.ready}
      <UnifiedSetupOverlay {projectId} />
    {/if}
  </div>
</ProjectSync>
