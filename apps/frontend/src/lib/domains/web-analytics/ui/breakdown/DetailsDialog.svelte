<script lang="ts">
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    isOpen: boolean;
    title: string;
    class?: ClassValue;
    onclose: () => void;
    children: Snippet;
  };

  const {
    isOpen,
    title,
    class: className = 'max-w-lg',
    onclose,
    children,
  }: Props = $props();

  const titleId = $props.id();
</script>

<Modal
  {isOpen}
  onClose={onclose}
  aria-labelledby={titleId}
  class={['flex max-h-[min(40rem,85dvh)] w-full flex-col p-0', className]}
>
  <header class="flex items-center justify-between gap-3 px-5 pt-5">
    <h2 id={titleId} class="text-base font-semibold">{title}</h2>
    <button
      type="button"
      class="hover:bg-surface-elevated-hover-bg hover:text-fg-default transition-ink flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg-muted"
      aria-label="Close"
      onclick={onclose}
    >
      <CloseIcon class="size-4" />
    </button>
  </header>
  {@render children()}
</Modal>
