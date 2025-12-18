<script lang="ts">
  import { page } from '$app/state';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import ServiceSettings from '$lib/domains/app/projects/ui/ServiceSettings/ServiceSettings.svelte';

  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);
</script>

<ProjectSync>
  <ServiceSettings {clusterId} {projectId} />
</ProjectSync>
