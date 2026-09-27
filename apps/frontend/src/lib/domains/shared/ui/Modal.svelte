<script lang="ts">
  import { type Snippet } from 'svelte';
  import { quadInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    children: Snippet;
  };

  let { isOpen, onClose, children }: Props = $props();

  function handleBackdropClick() {
    onClose();
  }

  function handleDialogClose() {
    // This handles when dialog is closed by ESC key
    if (isOpen) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <dialog
    class="fixed top-0 left-0 z-[999] flex h-full w-full overflow-y-auto bg-transparent p-4"
    onclose={handleDialogClose}
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
      role="button"
      onclick={() => {
        handleBackdropClick();
      }}
    ></div>
  </dialog>
{/if}
