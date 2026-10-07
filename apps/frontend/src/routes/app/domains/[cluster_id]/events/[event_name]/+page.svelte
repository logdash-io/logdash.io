<script lang="ts">
  import WebAnalyticsEventView from '$lib/domains/web-analytics/ui/event/WebAnalyticsEventView.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

{#key `${params.cluster_id}/${params.event_name}`}
  <WebAnalyticsEventView
    clusterId={params.cluster_id}
    name={params.event_name}
  />
{/key}
