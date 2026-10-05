<script lang="ts">
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { confirmDialog } from './confirm.state.svelte.js';

  const id = $props.id();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const request = $derived(confirmDialog.request);
</script>

<Modal
  isOpen={confirmDialog.isOpen}
  onClose={() => confirmDialog.settle(false)}
  role="alertdialog"
  aria-labelledby={titleId}
  aria-describedby={descriptionId}
  class="w-md p-5"
>
  {#if request}
    <div class="flex gap-4">
      <div
        class="bg-error-bg text-error flex size-9 shrink-0 items-center justify-center rounded-lg"
      >
        <DangerIcon class="size-4.5" />
      </div>
      <div class="flex min-w-0 flex-col gap-1.5 pt-1">
        <h2 id={titleId} class="text-fg-default text-base font-semibold">
          {request.title}
        </h2>
        <p id={descriptionId} class="text-fg-tertiary text-sm text-pretty">
          {request.description}
        </p>
      </div>
    </div>
    <div class="mt-6 flex justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        onclick={() => confirmDialog.settle(false)}
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        size="sm"
        onclick={() => confirmDialog.settle(true)}
      >
        {request.confirmLabel}
      </Button>
    </div>
  {/if}
</Modal>
