<script lang="ts">
  import WebAnalyticsDashboard from '$lib/domains/web-analytics/ui/WebAnalyticsDashboard.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

{#key params.cluster_id}
  <WebAnalyticsDashboard clusterId={params.cluster_id} />
{/key}
