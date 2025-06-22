<script lang="ts">
  import { CheckIcon } from 'lucide-svelte';

  interface Props {
    chatName: string;
    onDone: () => void;
  }

  let { chatName, onDone }: Props = $props();
</script>

<div class="text-center">
  <div class="avatar placeholder mb-4">
    <div class="bg-success text-success-content h-12 w-12 rounded-full">
      <CheckIcon class="h-6 w-6" />
    </div>
  </div>

  <h3 class="mb-2 text-lg font-semibold">Success!</h3>

  <p class="mb-6 text-sm opacity-70">
    Telegram notifications have been set up successfully for <strong>
      {chatName}
    </strong>
    . You'll now receive alerts for monitor status changes.
  </p>

  <button type="button" class="btn btn-success w-full" onclick={onDone}>
    Done
  </button>
</div>
