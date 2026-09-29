<script lang="ts">
  import { type Snippet } from 'svelte';
  import { quadInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    dismissible?: boolean;
    children: Snippet;
  };

  let { isOpen, onClose, dismissible = true, children }: Props = $props();

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) {
      return;
    }

    onDismiss();
  }

  function onDismiss(): void {
    if (isOpen && dismissible) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if isOpen}
  <dialog
    class="fixed top-0 left-0 z-[999] flex h-full w-full overflow-y-auto bg-transparent p-4"
  >
    <div
      transition:scale={{
        duration: 200,
        easing: quadInOut,
        start: 0.95,
      }}
      class="ld-card relative z-10 m-auto w-xl max-w-full"
    >
      {@render children()}
    </div>
    <div
      transition:fade={{ duration: 200, easing: quadInOut }}
      class="bg-surface-root/60 fixed inset-0"
      aria-hidden="true"
      onclick={onDismiss}
    ></div>
  </dialog>
{/if}
