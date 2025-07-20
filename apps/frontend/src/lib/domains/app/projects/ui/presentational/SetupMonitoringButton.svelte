<script lang="ts">
  import { clickShortcut } from '$lib/domains/shared/ui/actions/click-shortcut.svelte.js';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url.js';
  import { CheckIcon, XIcon } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';
  import { MonitorMode } from '../../domain/monitoring/monitor-mode.js';

  type Props = {
    class?: string;
    children: Snippet;
    canAddMore: boolean;
    delayIn?: number;
    delayOut?: number;
    onSubmit: (params: { name: string; mode: MonitorMode }) => void;
  };
  const { onSubmit, class: className = '', children }: Props = $props();

  const MIN_NAME_LENGTH = 3;
  const MAX_NAME_LENGTH = 800;

  let selectedMode = $state(MonitorMode.PULL);
  let url = $state('');
  let monitorName = $state('');

  const urlValid = $derived(isValidUrl(url));
  const isFormValid = $derived(
    selectedMode === MonitorMode.PULL
      ? urlValid
      : monitorName.length >= MIN_NAME_LENGTH,
  );
</script>

{#snippet configurator(close: () => void)}
  <div
    class={[
      'ld-card-base ring-base-100 flex flex-col gap-4 rounded-xl p-6 shadow-xl ring transition-colors',
      {
        'focus-within:ring-success/50': isFormValid,
        'focus-within:ring-primary/50': !isFormValid,
      },
    ]}
  >
    <!-- Mode Tabs -->
    <div class="tabs tabs-boxed tabs-sm w-full">
      <button
        class={[
          'tab px-3',
          { 'tab-active bg-base-100': selectedMode === MonitorMode.PULL },
        ]}
        onclick={() => (selectedMode = MonitorMode.PULL)}
        type="button"
      >
        Pull
      </button>
      <button
        class={[
          'tab px-3',
          { 'tab-active bg-base-100': selectedMode === MonitorMode.PUSH },
        ]}
        onclick={() => (selectedMode = MonitorMode.PUSH)}
        type="button"
      >
        Push
      </button>
    </div>

    <!-- Input Section -->
    <div class="flex items-center justify-between gap-2">
      {#if selectedMode === MonitorMode.PULL}
        <input
          bind:value={url}
          minlength={MIN_NAME_LENGTH}
          maxlength={MAX_NAME_LENGTH}
          class="input-sm input-ghost selection:bg-secondary/20 h-12 w-full rounded-lg px-4 text-lg font-semibold outline-0 focus:bg-transparent"
          placeholder="URL to monitor"
          use:autoFocus={{ delay: 5 }}
        />
      {:else}
        <input
          bind:value={monitorName}
          minlength={MIN_NAME_LENGTH}
          maxlength={MAX_NAME_LENGTH}
          class="input-sm input-ghost selection:bg-secondary/20 h-12 w-full rounded-lg px-4 text-lg font-semibold outline-0 focus:bg-transparent"
          placeholder="Monitor name"
          use:autoFocus={{ delay: 5 }}
        />
      {/if}

      <button
        disabled={!isFormValid}
        class="btn btn-success btn-soft btn-sm btn-square"
        onclick={() => {
          const name =
            selectedMode === MonitorMode.PULL
              ? tryPrependProtocol(url)
              : monitorName;
          onSubmit({ name, mode: selectedMode });
          close();
        }}
        use:clickShortcut={{ key: 'Enter' }}
      >
        <CheckIcon class="h-4 w-4" />
      </button>

      <button
        class="btn btn-error btn-soft btn-sm btn-square"
        onclick={close}
        use:clickShortcut={{ key: 'Escape' }}
      >
        <XIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
{/snippet}

<div class="relative z-20 flex">
  <Tooltip
    placement="bottom"
    content={configurator}
    trigger="click"
    class="w-full"
    interactive={true}
  >
    <button
      in:fly={{ y: -2, duration: 100 }}
      class={['cursor-pointer', className]}
    >
      {@render children()}
    </button>
  </Tooltip>
</div>
