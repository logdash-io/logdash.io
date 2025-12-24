<script lang="ts">
  import StatusPageConfigInline from '$lib/domains/app/projects/ui/setup/status-page/StatusPageConfigInline.svelte';

  type Props = {
    data: {
      clusterId: string;
      statusPageId: string;
    };
  };
  const { data }: Props = $props();
</script>

<div class="flex h-full w-full flex-col overflow-y-auto">
  <StatusPageConfigInline
    clusterId={data.clusterId}
    dashboardId={data.statusPageId}
  />
</div>
