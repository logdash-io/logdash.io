<script lang="ts">
  import NewMonitorView from '$lib/domains/app/uptime/ui/NewMonitorView.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<NewMonitorView clusterId={params.cluster_id} />
