<script lang="ts">
  import MonitorView from '$lib/domains/app/uptime/ui/MonitorView.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

{#key params.monitor_id}
  <MonitorView clusterId={params.cluster_id} monitorId={params.monitor_id} />
{/key}
