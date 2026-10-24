<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/state';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import LogsHeader from './header/LogsHeader.svelte';
  import LogsVirtualList from './LogsVirtualList.svelte';
  import { logAnalyticsState } from '../../application/log-analytics.state.svelte.js';
  import { logPreviewState } from '../../application/log-preview.state.svelte.js';
  import { filtersStore } from '../../infrastructure/filters.store.svelte.js';
  import { namespacesState } from '../../infrastructure/namespaces.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import SdkSetupPrompt from '$lib/domains/app/projects/ui/setup/SdkSetupPrompt.svelte';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { Feature } from '$lib/domains/shared/types.js';

  type Props = {
    volume?: boolean;
  };

  const { volume = false }: Props = $props();

  const clusterId = $derived(page.params.cluster_id);
  const userId = $derived(userState.id);
  const configured = $derived(
    !clusterId ||
      !projectsState.ready ||
      projectsState.hasConfiguredFeature(Feature.LOGGING) ||
      logsState.logs.length > 0,
  );
  const showApp = $derived(
    projectsState.appNames.length > 1 && filtersStore.apps.length !== 1,
  );

  const maxRetentionHours = $derived(
    exposedConfigState.logRetentionHours(userState.tier),
  );

  const defaultStartDate = $derived(
    new Date(Date.now() - maxRetentionHours * 60 * 60 * 1000),
  );

  let rendered = $state(false);

  onMount(() => {
    const timer = setTimeout(() => {
      rendered = true;
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  });

  $effect(() => {
    void clusterId;
    untrack(() => {
      const linkedApp = page.url.searchParams.get('app');

      if (userId && clusterId) {
        filtersStore.initPersistence(userId, clusterId);
      }
      filtersStore.setFilters({
        startDate: filtersStore.startDate || defaultStartDate.toISOString(),
        endDate: filtersStore.endDate || null,
        defaultStartDate: defaultStartDate.toISOString(),
        ...(linkedApp && { apps: [linkedApp] }),
      });
    });
  });

  $effect(() => {
    if (!clusterId) return;

    void namespacesState.init(clusterId, filtersStore.apps);
  });

  $effect(() => {
    if (!clusterId) return;

    return () => {
      namespacesState.reset();
      logPreviewState.close();
    };
  });

  $effect(() => {
    void filtersStore.filters;
    if (!clusterId) {
      return;
    }

    const cleanup = untrack(() => {
      logsState.resync(clusterId);
      return volume ? logAnalyticsState.sync(clusterId) : undefined;
    });

    return () => {
      cleanup?.();
      logsState.unsync();
    };
  });
</script>

<Well label="Logs" class="min-h-0 flex-1">
  <LogsHeader volume={volume && configured} />

  {#if configured}
    <LogsVirtualList logs={logsState.logs} {rendered} {showApp} />
  {:else if clusterId}
    <div
      class="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
    >
      <p class="font-medium">No logs yet</p>
      <p class="text-fg-tertiary max-w-sm text-sm text-balance">
        Every app on this domain sends its logs here with one key, named by the
        SDK's app option.
      </p>
      <div class="mt-2">
        <SdkSetupPrompt {clusterId} feature={Feature.LOGGING} />
      </div>
    </div>
  {/if}
</Well>
