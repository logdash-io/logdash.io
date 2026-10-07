<script lang="ts">
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import { Button } from '@logdash/hyper-ui/presentational';

  interface Props {
    errorMessage: string;
    onCancel: () => void;
    onRetry: () => void;
  }

  let { errorMessage, onCancel, onRetry }: Props = $props();
</script>

<div class="flex flex-col gap-5">
  <div class="flex items-center gap-4">
    <div
      class="bg-surface-150-bg text-error flex size-9 shrink-0 items-center justify-center rounded-lg"
    >
      <DangerIcon class="size-4.5" />
    </div>
    <div class="flex min-w-0 flex-col gap-0.5">
      <h2 class="text-base font-semibold">Telegram setup failed</h2>
      <p class="text-fg-tertiary text-sm">
        Please check your connection and try again.
      </p>
    </div>
  </div>

  <p
    class="bg-surface-50-bg edge text-fg-secondary rounded-lg px-3 py-2.5 font-mono text-sm break-words"
  >
    Error: {errorMessage}
  </p>

  <div class="flex justify-end gap-2">
    <Button variant="ghost" onclick={onCancel}>Cancel</Button>
    <Button variant="primary" onclick={onRetry}>Try Again</Button>
  </div>
</div>
