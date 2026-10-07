<script lang="ts">
  import UptimeDashboard from '$lib/domains/app/uptime/ui/UptimeDashboard.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

{#key params.cluster_id}
  <UptimeDashboard clusterId={params.cluster_id} />
{/key}
