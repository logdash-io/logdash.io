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

<div class="flex flex-col gap-5">
  <div class="flex items-center gap-4">
    <div
      class="bg-surface-150-bg flex size-9 shrink-0 items-center justify-center rounded-lg"
    >
      <SendIcon class="size-4.5" />
    </div>
    <div class="flex min-w-0 flex-col gap-0.5">
      <h2 class="text-base font-semibold">Set up a Telegram channel</h2>
      <p class="text-fg-tertiary text-sm">
        This is the hard part, so we made it easy!
      </p>
    </div>
  </div>

  <ol class="flex flex-col gap-3 text-sm">
    <li class="flex flex-col gap-1">
      <h3 class="font-medium">Step 1</h3>
      <p class="text-fg-tertiary select-none">
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
    </li>
    <li class="flex flex-col gap-1">
      <h3 class="font-medium">Step 2</h3>
      <p class="text-fg-tertiary">
        Copy the passphrase below and send it as a message in that chat.
      </p>
    </li>
  </ol>

  <div class="flex flex-col gap-1.5">
    <Label for="telegram-passphrase" class="text-sm font-medium">
      Passphrase
    </Label>
    <div class="flex items-center gap-2">
      <Input
        id="telegram-passphrase"
        type="text"
        value={passphrase}
        readonly
        class="min-w-0 flex-1 font-mono"
      />
      <Button
        variant="ghost"
        shape="circle"
        aria-label="Copy passphrase"
        onclick={copyToClipboard}
      >
        {#if copied}
          <CheckIcon class="text-success size-4" />
        {:else}
          <CopyIcon class="size-4" />
        {/if}
      </Button>
    </div>
  </div>

  <div class="flex justify-end gap-2">
    <Button variant="ghost" onclick={onCancel}>Back</Button>
    <Button variant="primary" onclick={onNext}>Message sent!</Button>
  </div>
</div>
