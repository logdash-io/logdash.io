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
    class="fixed left-0 top-0 z-[999] flex h-full w-full items-center justify-center bg-transparent"
    onclose={handleDialogClose}
  >
    <div
      transition:scale={{
        duration: 200,
        easing: quadInOut,
        start: 0.95,
      }}
      class="ld-card w-xl z-10"
    >
      {@render children()}
    </div>
    <div
      transition:fade={{ duration: 200, easing: quadInOut }}
      class="bg-base-300/80 absolute left-0 top-0 grid h-full w-full self-stretch"
      role="button"
      onclick={() => {
        handleBackdropClick();
      }}
    ></div>
  </dialog>
{/if}
