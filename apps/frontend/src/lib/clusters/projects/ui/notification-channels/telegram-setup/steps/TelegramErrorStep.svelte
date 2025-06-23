<script lang="ts">
  import { AlertTriangleIcon } from 'lucide-svelte';

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
      <AlertTriangleIcon class="h-6 w-6" />
    </div>

    <div class="flex flex-col items-start">
      <h3 class="text-xl font-semibold">Telegram Setup Failed</h3>
      <p class="text-secondary/70 text-sm">
        Please check your connection and try again.
      </p>
    </div>
  </div>

  <span class="block truncate text-left font-mono text-lg">
    Error: {errorMessage}
  </span>

  <div class="flex gap-3">
    <button type="button" class="btn btn-secondary flex-1" onclick={onCancel}>
      Cancel
    </button>
    <button type="button" class="btn btn-primary flex-1" onclick={onRetry}>
      Try Again
    </button>
  </div>
</div>
