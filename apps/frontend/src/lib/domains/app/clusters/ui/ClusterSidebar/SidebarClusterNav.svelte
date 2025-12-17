<script lang="ts">
  import { page } from '$app/state';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';

  const clusterId = $derived(page.params.cluster_id);
  const currentPath = $derived(page.url.pathname);

  const isCockpitActive = $derived(
    currentPath === `/app/clusters/${clusterId}/cockpit`,
  );
  const isSettingsActive = $derived(
    currentPath === `/app/clusters/${clusterId}/settings`,
  );
</script>

<nav class="flex flex-col gap-0.5">
  <a
    href="/app/clusters/{clusterId}/cockpit"
    class={[
      'flex w-full text-sm items-center gap-2 rounded-lg p-2',
      {
        'bg-base-100 text-base-content': isCockpitActive,
        'hover:bg-base-100/80': !isCockpitActive,
      },
    ]}
  >
    <HomeIcon class="size-4 shrink-0" />
    <span class="truncate">Home</span>
  </a>
  <a
    href="/app/clusters/{clusterId}/settings"
    class={[
      'flex w-full text-sm items-center gap-2 rounded-lg p-2',
      {
        'bg-base-100 text-base-content': isSettingsActive,
        'hover:bg-base-100/80': !isSettingsActive,
      },
    ]}
  >
    <SettingsIcon class="size-4 shrink-0" />
    <span class="truncate">Settings</span>
  </a>
</nav>
