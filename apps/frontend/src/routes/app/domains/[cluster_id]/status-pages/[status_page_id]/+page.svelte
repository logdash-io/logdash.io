<script lang="ts">
  import StatusPageConfigInline from '$lib/domains/app/projects/ui/setup/status-page/StatusPageConfigInline.svelte';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
</script>

<StatusPageConfigInline
  clusterId={data.clusterId}
  dashboardId={data.statusPageId}
/>
