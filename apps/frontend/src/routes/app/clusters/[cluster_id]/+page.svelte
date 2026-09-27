<script lang="ts">
  import ClusterCockpit from '$lib/domains/app/clusters/ui/ClusterCockpit/ClusterCockpit.svelte';
  import type { PageProps } from './$types';

  const { data, params }: PageProps = $props();

  const clusterId = $derived(params.cluster_id);
</script>

<ClusterCockpit {clusterId} initialMonitors={data.initialMonitors} />
