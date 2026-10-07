<script lang="ts">
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import LogsTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
</script>

<ProjectSync>
  <div class="@container relative flex flex-1 flex-col">
    <div
      class="flex flex-col gap-2 p-2 @4xl:absolute @4xl:inset-0 @4xl:flex-row"
    >
      <LogsTile />

      <div class="flex min-h-0 shrink-0 flex-col @4xl:w-72 @6xl:w-80">
        <MetricsTiles />
      </div>
    </div>
  </div>
</ProjectSync>
