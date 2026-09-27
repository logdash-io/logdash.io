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

<div class="space-y-6 text-center">
  <div class="flex items-center justify-start gap-4">
    <div
      class="error-card flex h-14 w-14 items-center justify-center rounded-full"
    >
      <DangerIcon class="h-6 w-6" />
    </div>

    <div class="flex flex-col items-start">
      <h3 class="text-xl font-medium">Telegram Setup Failed</h3>
      <p class="text-neutral-400 text-sm">
        Please check your connection and try again.
      </p>
    </div>
  </div>

  <span class="block truncate text-left font-mono text-lg">
    Error: {errorMessage}
  </span>

  <div class="flex gap-3">
    <Button variant="primary" class="flex-1" onclick={onCancel}>Cancel</Button>
    <Button variant="primary" class="flex-1" onclick={onRetry}>
      Try Again
    </Button>
  </div>
</div>
