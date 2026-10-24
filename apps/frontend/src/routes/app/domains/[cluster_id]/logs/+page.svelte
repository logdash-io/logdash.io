<script lang="ts">
  import DomainSync from '$lib/domains/app/projects/ui/ProjectView/DomainSync.svelte';
  import LogsTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
</script>

<DomainSync>
  <div class="flex flex-1 flex-col p-2">
    <LogsTile volume />
  </div>
</DomainSync>
