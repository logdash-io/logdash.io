<script lang="ts">
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import SendIcon from '$lib/domains/shared/icons/SendIcon.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { browser } from '$app/environment';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Button, Input, Kbd, Label } from '@logdash/hyper-ui/presentational';

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
      toast.error(`Failed to copy bot name: ${String(err)}`);
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-start gap-4">
    <div
      class="bg-surface-root border-border-default text-fg-default flex h-14 w-14 items-center justify-center rounded-full border"
    >
      <SendIcon class="h-6 w-6" />
    </div>

    <div class="flex flex-col items-start">
      <h3 class="text-xl font-medium">Setup Telegram Channel</h3>
      <p class="text-neutral-400 text-sm">
        This is the hard part, so we made it easy!
      </p>
    </div>
  </div>

  <div class="text-fg-default mb-6 text-sm">
    <h4 class="text-lg font-medium">Step 1</h4>
    <p class="text-neutral-400 mb-4 select-none">
      Add the bot
      <button
        type="button"
        class="cursor-pointer"
        onclick={copyBotName}
        title="Click to copy bot name"
      >
        <Kbd size="sm">@logdash_uptime_bot</Kbd>
      </button>
      to your Telegram group or chat.
    </p>

    <h4 class="text-lg font-medium">Step 2</h4>
    <p class="text-neutral-400">
      Copy the passphrase below and send it as a message in that chat.
    </p>
  </div>

  <div class="mb-6">
    <Label for="telegram-passphrase">
      <span class="font-medium">Passphrase</span>
    </Label>
    <div class="relative">
      <Input
        id="telegram-passphrase"
        type="text"
        value={passphrase}
        readonly
        class="w-full flex-1"
      />

      <Button
        variant="transparent"
        class="absolute right-0 z-10"
        aria-label="Copy passphrase"
        onclick={copyToClipboard}
      >
        {#if copied}
          <CheckIcon class="text-success h-4 w-4" />
        {:else}
          <CopyIcon class="h-4 w-4" />
        {/if}
      </Button>
    </div>
  </div>

  <div class="flex gap-3">
    <Button variant="soft" class="flex-1" onclick={onCancel}>Back</Button>
    <Button variant="primary" class="flex-1" onclick={onNext}>
      Message sent!
    </Button>
  </div>
</div>
