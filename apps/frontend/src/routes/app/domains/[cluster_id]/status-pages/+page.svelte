<script lang="ts">
  import StatusPagesList from '$lib/domains/app/projects/ui/setup/status-page/StatusPagesList.svelte';
  import type { PageProps } from './$types';

  const { data, params }: PageProps = $props();
</script>

<StatusPagesList clusterId={params.cluster_id} dashboards={data.dashboards} />
