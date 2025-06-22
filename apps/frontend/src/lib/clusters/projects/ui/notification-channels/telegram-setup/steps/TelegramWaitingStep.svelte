<script lang="ts">
  import { LoaderIcon } from 'lucide-svelte';

  interface Props {
    passphrase: string;
    onCancel: () => void;
    onBack: () => void;
  }

  let { passphrase, onCancel, onBack }: Props = $props();
</script>

<div class="text-center">
  <div class="avatar placeholder mb-4">
    <div class="bg-warning text-warning-content h-12 w-12 rounded-full">
      <LoaderIcon class="h-6 w-6 animate-spin" />
    </div>
  </div>

  <h3 class="mb-2 text-lg font-semibold">Waiting for Message</h3>

  <p class="mb-6 text-sm opacity-70">
    Please send the passphrase <code class="kbd kbd-sm">{passphrase}</code>
    in your Telegram chat. We're listening for it...
  </p>

  <div class="flex gap-3">
    <button type="button" class="btn btn-outline flex-1" onclick={onCancel}>
      Cancel
    </button>
    <button type="button" class="btn btn-neutral flex-1" onclick={onBack}>
      Back
    </button>
  </div>
</div>
