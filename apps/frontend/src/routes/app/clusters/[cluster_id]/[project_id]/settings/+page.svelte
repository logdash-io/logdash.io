<script lang="ts">
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import ServiceSettings from '$lib/domains/app/projects/ui/ServiceSettings/ServiceSettings.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();

  const clusterId = $derived(params.cluster_id);
  const projectId = $derived(params.project_id);
</script>

<ProjectSync>
  <ServiceSettings {clusterId} {projectId} />
</ProjectSync>
