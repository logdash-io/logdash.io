<script lang="ts">
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import ChannelSetupStep from '$lib/domains/app/projects/ui/notification-channels/ChannelSetupStep.svelte';
  import { Button, Input, Label } from '@logdash/hyper-ui/presentational';

  type Props = {
    passphrase: string;
    onBack: () => void;
    onNext: () => void;
  };

  const BOT_NAME = '@logdash_uptime_bot';

  const { passphrase, onBack, onNext }: Props = $props();

  let copiedValue = $state<string | null>(null);

  async function onCopy(value: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      copiedValue = value;
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => {
        if (copiedValue === value) {
          copiedValue = null;
        }
      }, 2000);
    } catch (error) {
      toast.error(`Failed to copy ${label.toLowerCase()}: ${String(error)}`);
    }
  }
</script>

<ChannelSetupStep
  title="Connect Telegram"
  description="Add the bot to a group or chat, then send the passphrase there as a message."
  {onBack}
  onSubmit={onNext}
>
  <div class="flex flex-col gap-4">
    {@render copyField('telegram-bot', 'Bot', BOT_NAME)}
    {@render copyField('telegram-passphrase', 'Passphrase', passphrase)}
  </div>

  {#snippet action()}
    <Button type="submit" variant="primary">Message sent</Button>
  {/snippet}
</ChannelSetupStep>

{#snippet copyField(id: string, label: string, value: string)}
  <div class="flex flex-col gap-1.5">
    <Label for={id} class="text-fg-muted text-sm">{label}</Label>
    <div class="relative flex w-full">
      <Input {id} type="text" {value} readonly class="w-full pr-11 font-mono" />
      <Button
        variant="ghost"
        size="sm"
        shape="circle"
        class="absolute top-1 right-1"
        aria-label={`Copy ${label.toLowerCase()}`}
        onclick={() => onCopy(value, label)}
      >
        {#if copiedValue === value}
          <CheckIcon class="text-success size-4" />
        {:else}
          <CopyIcon class="size-4" />
        {/if}
      </Button>
    </div>
  </div>
{/snippet}
