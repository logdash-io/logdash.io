<script lang="ts">
  import { SDK_LIST } from '$lib/domains/logs/domain/sdk-config.js';
  import { generateUnifiedSetupPrompt } from '$lib/domains/app/projects/domain/unified-setup-prompt.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { sdkSelectionState } from '$lib/domains/app/projects/application/sdk-selection.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import { Button, Tooltip } from '@logdash/hyper-ui/presentational';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { scale } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';
  import { Feature } from '$lib/domains/shared/types.js';

  type Props = {
    projectId: string;
    feature: Feature.LOGGING | Feature.METRICS;
  };
  const { projectId, feature }: Props = $props();

  const COPIED_MS = 2000;

  let copied = $state(false);

  const selectedSDK = $derived(SDK_LIST[sdkSelectionState.selectedIndex]);
  const isLoading = $derived(projectsState.isLoadingApiKey(projectId));

  const needsLogging = $derived(
    feature === Feature.LOGGING ||
      (projectsState.hasFeature(projectId, Feature.LOGGING) &&
        !projectsState.hasConfiguredFeature(projectId, Feature.LOGGING) &&
        logsState.logs.length === 0),
  );
  const needsMetrics = $derived(
    feature === Feature.METRICS ||
      (projectsState.hasFeature(projectId, Feature.METRICS) &&
        !projectsState.hasConfiguredFeature(projectId, Feature.METRICS) &&
        metricsState.simplifiedMetrics.length === 0),
  );

  $effect(() => {
    sdkSelectionState.initialize();
  });

  async function onCopyPrompt(): Promise<void> {
    try {
      const apiKey = await projectsState.getApiKey(projectId);
      const setupPrompt = generateUnifiedSetupPrompt(
        selectedSDK.name,
        apiKey,
        needsLogging,
        needsMetrics,
      );
      await navigator.clipboard.writeText(setupPrompt);
    } catch (error) {
      const message = readHttpErrorMessage(error) ?? 'Something went wrong';
      toast.error(`Failed to copy the setup prompt: ${message}`, 5000);
      return;
    }

    copied = true;
    setTimeout(() => {
      copied = false;
    }, COPIED_MS);
    toast.success(
      'Setup prompt copied. Paste it into your AI assistant.',
      5000,
    );
  }

  function onSelectSDK(index: number, close: () => void): void {
    sdkSelectionState.setSelectedIndex(index);
    close();
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <Button
    variant="primary"
    size="sm"
    onclick={onCopyPrompt}
    loading={isLoading}
    data-posthog-id="copy-setup-prompt-button"
  >
    {@render copyIcon()}
    Copy prompt
  </Button>

  <Tooltip
    content={sdkMenu}
    interactive={true}
    placement="bottom"
    trigger="click"
    closeOnOutsideTooltipClick={true}
  >
    <button
      type="button"
      class="ring-hairline text-neutral-400 hover:text-fg-default transition-ink flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs ring-1 ring-inset"
      aria-label="SDK: {selectedSDK.name}"
      data-posthog-id="sdk-selection-button"
    >
      <selectedSDK.icon class="size-3.5 shrink-0" />
      {selectedSDK.name}
      <ChevronDownIcon class="size-3.5 shrink-0" />
    </button>
  </Tooltip>
</div>

{#snippet sdkMenu(close: () => void)}
  <div
    class="fixed inset-0 z-[-1]"
    onmousedown={close}
    role="button"
    tabindex="-1"
  ></div>
  <ul class="ld-card-base relative z-20 rounded-xl p-1.5 shadow-sm">
    {#each SDK_LIST as sdk, index (sdk.name)}
      <li>
        <button
          type="button"
          onclick={(e) => {
            e.stopPropagation();
            onSelectSDK(index, close);
          }}
          class={[
            'hover:bg-surface-100 flex w-full cursor-pointer items-center gap-2 rounded-md p-1.5 text-xs select-none',
            { 'bg-surface-100': index === sdkSelectionState.selectedIndex },
          ]}
        >
          <sdk.icon class="size-4 shrink-0" />
          <span>{sdk.name}</span>
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet copyIcon()}
  <span class="relative flex size-4 items-center justify-center">
    {#if copied}
      <span
        class="text-success absolute"
        in:scale={{ duration: 400, easing: elasticOut, start: 0.3 }}
      >
        <CheckIcon class="size-4" />
      </span>
    {:else}
      <span class="absolute" in:scale={{ duration: 200, start: 0.8 }}>
        <CopyIcon class="size-4" />
      </span>
    {/if}
  </span>
{/snippet}
