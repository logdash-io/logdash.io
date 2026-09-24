<script lang="ts">
  import ProjectView from '$lib/domains/app/projects/ui/ProjectView/ProjectView.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<ProjectView clusterId={params.cluster_id} projectId={params.project_id} />
