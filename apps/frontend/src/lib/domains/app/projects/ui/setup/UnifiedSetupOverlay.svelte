<script lang="ts">
  import { SDK_LIST } from '$lib/domains/logs/domain/sdk-config.js';
  import { generateUnifiedSetupPrompt } from '$lib/domains/app/projects/domain/unified-setup-prompt.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { sdkSelectionState } from '$lib/domains/app/projects/application/sdk-selection.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
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

  const hasLogging = $derived(
    projectsState.hasConfiguredFeature(projectId, Feature.LOGGING) ||
      logsState.logs.length > 0,
  );

  const hasMetrics = $derived(
    projectsState.hasConfiguredFeature(projectId, Feature.METRICS) ||
      !metricsState.isUsingFakeData,
  );

  const needsLogging = $derived(!hasLogging);
  const needsMetrics = $derived(!hasMetrics);

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
    navigator.clipboard.writeText(setupPrompt);
    copied = true;
    toast.success(
      'Setup prompt copied! Paste it into your favourite AI assistant.',
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
    class="dropdown dropdown-center ld-card-base z-20 overflow-visible rounded-xl p-1.5 shadow-sm"
  >
    {#each SDK_LIST as sdk, index}
      <li
        onclick={(e) => {
          e.stopPropagation();
          onSelectSDK(index, close);
        }}
        class="hover:bg-base-100/70 flex cursor-pointer select-none flex-row items-center justify-start gap-2 rounded-md p-1.5 text-xs"
      >
        <sdk.icon class="h-4 w-4 shrink-0" />
        <div class="block">{sdk.name}</div>
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
  class="absolute group inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-[2px]"
>
  <div
    class="flex flex-col items-center gap-2 ld-card-bg p-2 rounded-2xl ld-card-border"
  >
    <p class="text-sm text-base-content opacity-60">{overlayTitle}</p>

    <button
      class="btn btn-secondary gap-2 pr-1 opacity-80 group-hover:opacity-100 transition-opacity"
      onclick={onCopyPrompt}
      disabled={isLoading}
    >
      {#if isLoading}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        {@render copyIcon()}
      {/if}
      Copy prompt

      <Tooltip
        content={sdkMenu}
        interactive={true}
        placement="bottom"
        trigger="click"
      >
        <button
          class="btn btn-sm bg-base-100"
          data-posthog-id="sdk-selection-button"
        >
          <selectedSDK.icon class="h-4 w-4 shrink-0" />
          {selectedSDK.name}
          <ChevronDownIcon class="h-4 w-4 shrink-0" />
        </button>
      </Tooltip>
    </button>
  </div>
</div>
