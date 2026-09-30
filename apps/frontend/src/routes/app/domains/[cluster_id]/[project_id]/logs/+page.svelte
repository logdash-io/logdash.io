<script lang="ts">
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import LogsTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
</script>

<ProjectSync>
  <LogsTile volume />
</ProjectSync>
