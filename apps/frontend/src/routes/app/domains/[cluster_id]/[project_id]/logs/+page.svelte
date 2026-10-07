<script lang="ts">
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import LogsTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
</script>

<ProjectSync>
  <div class="flex flex-1 flex-col p-2">
    <LogsTile volume />
  </div>
</ProjectSync>
