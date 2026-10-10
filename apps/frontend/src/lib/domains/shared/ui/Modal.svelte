<script lang="ts">
  import { type Snippet, untrack } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { quadInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { toastHost } from '$lib/domains/shared/ui/toaster/toast-host.svelte.js';

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    dismissible?: boolean;
    class?: ClassValue;
    role?: 'dialog' | 'alertdialog';
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    children: Snippet;
  };

  let {
    isOpen,
    onClose,
    dismissible = true,
    class: className = 'w-xl p-5',
    role,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    children,
  }: Props = $props();

  let dialog = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    const node = dialog;

    if (isOpen && node) {
      return untrack(() => showModal(node));
    }
  });

  function showModal(node: HTMLDialogElement): () => void {
    const opener = document.activeElement;

    node.inert = false;
    node.showModal();
    const leaveToastHost = toastHost.enter(node);

    return () => {
      leaveToastHost();
      node.inert = true;
      node.close();

      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }

  function onCancel(event: Event): void {
    event.preventDefault();
    onDismiss();
  }

  function onNativeClose(): void {
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  function onDismiss(): void {
    if (isOpen && dismissible) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <dialog
    bind:this={dialog}
    class="fixed inset-0 z-999 m-0 flex h-full max-h-none w-full max-w-none overflow-y-auto border-0 bg-transparent p-4 backdrop:bg-transparent"
    {role}
    aria-labelledby={labelledBy}
    aria-describedby={describedBy}
    oncancel={onCancel}
    onclose={onNativeClose}
  >
    <div
      transition:scale={{
        duration: 200,
        easing: quadInOut,
        start: 0.95,
      }}
      class={[
        'bg-surface-elevated-bg border border-surface-elevated-border rounded-xl relative z-10 m-auto max-w-full',
        className,
      ]}
    >
      {@render children()}
    </div>
    <div
      transition:fade={{ duration: 200, easing: quadInOut }}
      class="bg-surface-root-bg/60 fixed inset-0 backdrop-blur-[2px]"
      aria-hidden="true"
      onclick={onDismiss}
    ></div>
  </dialog>
{/if}
