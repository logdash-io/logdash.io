<script lang="ts">
  import ClusterCockpit from '$lib/domains/app/clusters/ui/ClusterCockpit/ClusterCockpit.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<ClusterCockpit clusterId={params.cluster_id} />
