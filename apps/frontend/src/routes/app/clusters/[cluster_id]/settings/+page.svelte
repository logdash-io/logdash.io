<script lang="ts">
  import ClusterSettings from '$lib/domains/app/clusters/ui/ClusterSettings/ClusterSettings.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();

  const clusterId = $derived(params.cluster_id);
</script>

<ClusterSettings {clusterId} />
