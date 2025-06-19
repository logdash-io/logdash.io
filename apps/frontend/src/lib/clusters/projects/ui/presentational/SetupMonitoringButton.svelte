<script lang="ts">
  import { clickShortcut } from '$lib/shared/ui/actions/click-shortcut.svelte.js';
  import { autoFocus } from '$lib/shared/ui/actions/use-autofocus.svelte.js';
  import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
  import { isValidUrl, tryPrependProtocol } from '$lib/shared/utils/url.js';
  import { CheckIcon, XIcon } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';

  type Props = {
    class?: string;
    children: Snippet;
    canAddMore: boolean;
    delayIn?: number;
    delayOut?: number;
    onSubmit: (name: string) => void;
  };
  const { onSubmit, class: className = '', children }: Props = $props();

  const MIN_NAME_LENGTH = 3;
  const MAX_NAME_LENGTH = 800;

  let url = $state('');

  const urlValid = $derived(isValidUrl(url));
</script>

{#snippet configurator(close: () => void)}
  <div
    class={[
      'ld-card-base ring-base-100 flex h-20 w-96 items-center justify-between gap-2 rounded-xl pr-6 shadow-xl ring transition-colors',
      {
        'focus-within:ring-success/50': urlValid,
        'focus-within:ring-primary/50': !urlValid,
      },
    ]}
  >
    <input
      bind:value={url}
      minlength={MIN_NAME_LENGTH}
      maxlength={MAX_NAME_LENGTH}
      class="input-sm input-ghost selection:bg-secondary/20 h-full w-full rounded-lg pl-6 text-lg font-semibold outline-0 focus:bg-transparent"
      placeholder="Url to watch"
      use:autoFocus={{ delay: 5 }}
    />

    <button
      disabled={!urlValid}
      class="btn btn-success btn-soft btn-sm btn-square"
      onclick={() => {
        onSubmit(tryPrependProtocol(url));
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
{/snippet}

<div class="relative z-20 flex">
  <Tooltip
    placement="bottom"
    content={configurator}
    trigger="click"
    class="w-full"
  >
    <button
      in:fly={{ y: -2, duration: 100 }}
      class={['cursor-pointer', className]}
    >
      {@render children()}
    </button>
  </Tooltip>
</div>
