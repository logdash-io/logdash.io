<script lang="ts">
  import { AlertTriangleIcon } from 'lucide-svelte';

  interface Props {
    errorMessage: string;
    onCancel: () => void;
    onRetry: () => void;
  }

  let { errorMessage, onCancel, onRetry }: Props = $props();
</script>

<div class="text-center">
  <div class="avatar placeholder mb-4">
    <div class="bg-error text-error-content h-12 w-12 rounded-full">
      <AlertTriangleIcon class="h-6 w-6" />
    </div>
  </div>

  <h3 class="mb-2 text-lg font-semibold">Setup Failed</h3>

  <p class="mb-6 text-sm opacity-70">
    {errorMessage}
  </p>

  <div class="flex gap-3">
    <button type="button" class="btn btn-outline flex-1" onclick={onCancel}>
      Cancel
    </button>
    <button type="button" class="btn btn-primary flex-1" onclick={onRetry}>
      Try Again
    </button>
  </div>
</div>
