<script lang="ts">
  import { SendIcon, CheckIcon, CopyIcon } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';

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
      toast.success('Passphrase copied to clipboard!');
      setTimeout(() => (copied = false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  async function copyBotName() {
    if (!browser) return;

    try {
      await navigator.clipboard.writeText('@logdash_uptime_bot');
      toast.success('Bot name copied to clipboard!');
    } catch (err) {
      toast.error(`Failed to copy bot name: ${err}`);
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-start gap-4">
    <div
      class="bg-base-300 border-base-100 text-primary-content flex h-14 w-14 items-center justify-center rounded-full border"
    >
      <SendIcon class="h-6 w-6" />
    </div>

    <div class="flex flex-col items-start">
      <h3 class="text-xl font-semibold">Setup Telegram Channel</h3>
      <p class="text-secondary/70 text-sm">
        This is the hard part, so we made it easy!
      </p>
    </div>
  </div>

  <div class="text-secondary mb-6 text-sm">
    <h4 class="text-lg font-semibold">Step 1</h4>
    <p class="text-secondary/70 mb-4 select-none">
      Add the bot
      <code
        class="kbd kbd-sm hover:bg-base-200 cursor-pointer transition-colors"
        onclick={copyBotName}
        title="Click to copy bot name"
      >
        @logdash_uptime_bot
      </code>
      to your Telegram group or chat.
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
      Back
    </button>
    <button type="button" class="btn btn-primary flex-1" onclick={onNext}>
      Message sent!
    </button>
  </div>
</div>
