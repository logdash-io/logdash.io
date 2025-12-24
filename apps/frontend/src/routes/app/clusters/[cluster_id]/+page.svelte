<script lang="ts">
  import { page } from '$app/state';
  import ClusterCockpit from '$lib/domains/app/clusters/ui/ClusterCockpit/ClusterCockpit.svelte';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';

  type Props = {
    data: {
      initialMonitors: Monitor[];
    };
  };

  const { data }: Props = $props();

  const clusterId = $derived(page.params.cluster_id);
</script>

<ClusterCockpit {clusterId} initialMonitors={data.initialMonitors} />
