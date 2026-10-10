<script lang="ts">
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import ChannelSetupStep from '$lib/domains/app/projects/ui/notification-channels/ChannelSetupStep.svelte';
  import {
    Button,
    Input,
    Label,
    Spinner,
  } from '@logdash/hyper-ui/presentational';

  type Props = {
    passphrase: string;
    chatName: string;
    found: boolean;
    onBack: () => void;
    onSubmit: () => Promise<void>;
  };

  const { passphrase, chatName, found, onBack, onSubmit }: Props = $props();

  let isSaving = $state(false);

  async function onSave(): Promise<void> {
    if (!found || isSaving) {
      return;
    }

    isSaving = true;

    try {
      await onSubmit();
    } finally {
      isSaving = false;
    }
  }
</script>

<ChannelSetupStep
  title={found ? 'Telegram chat found' : 'Waiting for your message'}
  description={found
    ? 'Save it and every monitor on this domain alerts it.'
    : 'Send the passphrase in the chat with the bot. We check every few seconds.'}
  {onBack}
  onSubmit={onSave}
>
  <div class="flex flex-col gap-1.5">
    <Label for="telegram-chat" class="text-fg-muted text-sm">Chat</Label>
    <Input
      id="telegram-chat"
      type="text"
      value={chatName}
      placeholder={`Looking for “${passphrase}”…`}
      readonly
      class="w-full"
    >
      {#snippet leading()}
        {#if found}
          <CheckIcon class="text-success size-4 shrink-0" />
        {:else}
          <Spinner size="xs" class="shrink-0" />
        {/if}
      {/snippet}
    </Input>
  </div>

  {#snippet action()}
    <Button
      type="submit"
      variant="primary"
      disabled={!found || isSaving}
      loading={isSaving}
    >
      Save channel
    </Button>
  {/snippet}
</ChannelSetupStep>
