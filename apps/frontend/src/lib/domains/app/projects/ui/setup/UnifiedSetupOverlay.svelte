<script lang="ts">
  import { SDK_LIST } from '$lib/domains/logs/domain/sdk-config.js';
  import { generateUnifiedSetupPrompt } from '$lib/domains/app/projects/domain/unified-setup-prompt.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { sdkSelectionState } from '$lib/domains/app/projects/application/sdk-selection.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Button, Spinner, Tooltip } from '@logdash/hyper-ui/presentational';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { scale } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';
  import { Feature } from '$lib/domains/shared/types.js';

  type Props = {
    projectId: string;
  };
  const { projectId }: Props = $props();

  let copied = $state(false);

  const selectedSDK = $derived(SDK_LIST[sdkSelectionState.selectedIndex]);
  const isLoading = $derived(projectsState.isLoadingApiKey(projectId));

  const hasLoggingFeature = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );
  const hasMetricsFeature = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS),
  );

  const isLoggingConfigured = $derived(
    projectsState.hasConfiguredFeature(projectId, Feature.LOGGING) ||
      logsState.logs.length > 0,
  );

  const isMetricsConfigured = $derived(
    projectsState.hasConfiguredFeature(projectId, Feature.METRICS) ||
      !metricsState.isUsingFakeData,
  );

  const needsLogging = $derived(hasLoggingFeature && !isLoggingConfigured);
  const needsMetrics = $derived(hasMetricsFeature && !isMetricsConfigured);

  const overlayTitle = $derived.by(() => {
    if (needsLogging && needsMetrics) return 'Integrate Logging & Metrics';
    if (needsLogging) return 'Integrate Logging';
    return 'Integrate Metrics';
  });

  $effect(() => {
    sdkSelectionState.initialize();
  });

  $effect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => {
      copied = false;
    }, 2000);

    return () => clearTimeout(timeout);
  });

  async function onCopyPrompt(): Promise<void> {
    const apiKey = await projectsState.getApiKey(projectId);
    const setupPrompt = generateUnifiedSetupPrompt(
      selectedSDK.name,
      apiKey,
      needsLogging,
      needsMetrics,
    );
    await navigator.clipboard.writeText(setupPrompt);
    copied = true;
    toast.success(
      'Setup prompt copied! Paste it into your favorite AI assistant.',
      5000,
    );
  }

  function onSelectSDK(index: number, close: () => void): void {
    sdkSelectionState.setSelectedIndex(index);
    close();
  }
</script>

{#snippet sdkMenu(close: () => void)}
  <ul
    class="ld-card-base relative z-20 overflow-visible rounded-xl p-1.5 shadow-sm"
  >
    {#each SDK_LIST as sdk, index (sdk.name)}
      <li>
        <button
          type="button"
          onclick={(e) => {
            e.stopPropagation();
            onSelectSDK(index, close);
          }}
          class="hover:bg-neutral-800 flex w-full cursor-pointer select-none flex-row items-center justify-start gap-2 rounded-md p-1.5 text-xs"
        >
          <sdk.icon class="h-4 w-4 shrink-0" />
          <span class="block">{sdk.name}</span>
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet copyIcon()}
  <span class="relative flex h-4 w-4 items-center justify-center">
    {#if copied}
      <span
        class="absolute text-success"
        in:scale={{ duration: 400, easing: elasticOut, start: 0.3 }}
      >
        <CheckIcon class="h-4 w-4" />
      </span>
    {:else}
      <span class="absolute" in:scale={{ duration: 200, start: 0.8 }}>
        <CopyIcon class="h-4 w-4" />
      </span>
    {/if}
  </span>
{/snippet}

<div
  class="absolute group inset-0 z-50 flex items-center justify-center bg-surface-root/80 backdrop-blur-[2px]"
>
  <div
    class="flex flex-col items-center gap-2 ld-card-bg p-2 rounded-xl ld-card-border"
  >
    <p class="text-neutral-400 text-sm">{overlayTitle}</p>

    <div
      class="bg-surface-inverse hover:bg-surface-inverse-hover flex items-center rounded-full border-x border-transparent pr-1"
    >
      <Button
        variant="transparent"
        class="text-surface-root gap-2 pr-2"
        onclick={onCopyPrompt}
        disabled={isLoading}
      >
        {#if isLoading}
          <Spinner size="xs" aria-hidden="true" />
        {:else}
          {@render copyIcon()}
        {/if}
        Copy prompt
      </Button>

      <Tooltip
        content={sdkMenu}
        interactive={true}
        placement="bottom"
        trigger="click"
      >
        <Button
          size="sm"
          class="bg-surface-100 border-transparent"
          data-posthog-id="sdk-selection-button"
        >
          <selectedSDK.icon class="h-4 w-4 shrink-0" />
          {selectedSDK.name}
          <ChevronDownIcon class="h-4 w-4 shrink-0" />
        </Button>
      </Tooltip>
    </div>
  </div>
</div>
