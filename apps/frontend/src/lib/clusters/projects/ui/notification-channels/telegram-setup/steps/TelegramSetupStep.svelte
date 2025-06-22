<script lang="ts">
  import { SendIcon, CheckIcon, CopyIcon } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';

  interface Props {
    passphrase: string;
    onCancel: () => void;
    onNext: () => void;
  }

  let { passphrase, onCancel, onNext }: Props = $props();

  let copied = $state(false);

  async function copyToClipboard() {
    if (!browser) return;

    try {
      await navigator.clipboard.writeText(passphrase);
      copied = true;
      toast.success('Passphrase copied to clipboard!', 2000);
      setTimeout(() => (copied = false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-start gap-4">
    <div
      class="bg-base-300 border-base-100 text-primary-content flex h-12 w-12 items-center justify-center rounded-full border"
    >
      <SendIcon class="h-6 w-6" />
    </div>

    <h3 class="text-xl font-semibold">Setup Telegram Channel</h3>
  </div>

  <div class="text-secondary mb-6 text-sm">
    <h4 class="text-lg font-semibold">Step 1</h4>
    <p class="text-secondary/70 mb-4">
      Add the bot
      <code class="kbd kbd-sm">@logdash_uptime_bot</code>
      to your Telegram group or chat
      <span class="underline">as administrator</span>
      with messages read permission.
    </p>

    <h4 class="text-lg font-semibold">Step 2</h4>
    <p class="text-secondary/70">
      Copy the passphrase below and send it as a message in that chat.
    </p>
  </div>

  <div class="form-control mb-6">
    <label class="label">
      <span class="label-text font-medium">Passphrase</span>
    </label>
    <div class="relative">
      <input
        type="text"
        value={passphrase}
        readonly
        class="input input-bordered focus:border-primary/60 w-full flex-1 focus:outline-0"
      />

      <button
        type="button"
        class="btn btn-transparent absolute right-0 z-10"
        onclick={copyToClipboard}
      >
        {#if copied}
          <CheckIcon class="text-success h-4 w-4" />
        {:else}
          <CopyIcon class="h-4 w-4" />
        {/if}
      </button>
    </div>
  </div>

  <div class="flex gap-3">
    <button
      type="button"
      class="btn btn-secondary btn-soft flex-1"
      onclick={onCancel}
    >
      Cancel
    </button>
    <button type="button" class="btn btn-primary flex-1" onclick={onNext}>
      Message sent!
    </button>
  </div>
</div>
