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
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import { Feature } from '$lib/domains/shared/types.js';

  type Props = {
    volume?: boolean;
  };

  const { volume = false }: Props = $props();

  const projectId = $derived(page.params.project_id);
  const userId = $derived(userState.id);
  const configured = $derived(
    !projectId ||
      !projectsState.ready ||
      projectsState.hasConfiguredFeature(projectId, Feature.LOGGING) ||
      logsState.logs.length > 0,
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
    void projectId;
    untrack(() => {
      if (userId && projectId) {
        filtersStore.initPersistence(userId, projectId);
      }
      filtersStore.setFilters({
        startDate: filtersStore.startDate || defaultStartDate.toISOString(),
        endDate: filtersStore.endDate || null,
        defaultStartDate: defaultStartDate.toISOString(),
      });
    });
  });

  $effect(() => {
    if (!projectId) return;

    void namespacesState.init(projectId);

    return () => {
      namespacesState.reset();
      logPreviewState.close();
    };
  });

  $effect(() => {
    void filtersStore.filters;
    if (!projectId) {
      return;
    }

    const cleanup = untrack(() => {
      logsState.resync(projectId);
      return volume ? logAnalyticsState.sync(projectId) : undefined;
    });

    return () => {
      cleanup?.();
      logsState.unsync();
    };
  });
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <LogsHeader {projectId} volume={volume && configured} />

  {#if configured}
    <LogsVirtualList logs={logsState.logs} {rendered} />
  {:else if projectId}
    <EmptyState
      class="px-4 pb-4"
      title="No logs yet"
      description="Your app's logs land here once you add the SDK."
    >
      <SdkSetupPrompt {projectId} feature={Feature.LOGGING} />
    </EmptyState>
  {/if}
</div>
