<script lang="ts">
  import { page } from '$app/state';

  type Props = {
    id: string;
    clusterId: string;
    projectId: string;
  };

  const { id, clusterId, projectId }: Props = $props();
  const isSettingUp = $derived(page.url.pathname.includes('/setup/'));
</script>

<a
  class="text-secondary/60 text-xs whitespace-nowrap"
  data-posthog-id="{id}-cancel-setup-button"
  href={isSettingUp
    ? `/features`
    : `/app/clusters/${clusterId}?project_id=${projectId}`}
>
  Cancel
</a>
