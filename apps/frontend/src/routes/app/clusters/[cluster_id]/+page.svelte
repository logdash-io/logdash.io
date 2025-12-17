<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  const clusterId = $derived(page.params.cluster_id);

  $effect(() => {
    goto(`/app/clusters/${clusterId}/cockpit`, {
      replaceState: true,
    });
  });
</script>

<div class="flex h-full w-full items-center justify-center">
  <span class="loading loading-spinner loading-lg"></span>
</div>
