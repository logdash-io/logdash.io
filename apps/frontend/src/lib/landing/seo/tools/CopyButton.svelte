<script lang="ts">
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    text: string;
    label: string;
    class?: ClassValue;
  };

  const { text, label, class: className }: Props = $props();

  let copied = $state(false);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  async function onCopy(): Promise<void> {
    await navigator.clipboard.writeText(text);
    copied = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      copied = false;
    }, 1500);
  }
</script>

<button
  type="button"
  onclick={onCopy}
  aria-label={copied ? 'Copied' : label}
  class={[
    'text-fg-muted hover:text-fg-default bg-surface-root-bg flex shrink-0 cursor-pointer items-center justify-center transition-ink duration-150 outline-none focus-visible:shadow-(--focus-ring) motion-reduce:transition-none',
    className,
  ]}
>
  {#if copied}
    <CheckIcon class="size-3.5" />
  {:else}
    <CopyIcon class="size-3.5" />
  {/if}
</button>
