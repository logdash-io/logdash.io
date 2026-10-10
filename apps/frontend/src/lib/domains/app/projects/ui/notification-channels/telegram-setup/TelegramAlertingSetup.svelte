<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import { telegramSetupState } from '$lib/domains/app/projects/application/notification-channels/telegram-setup.state.svelte.js';
  import TelegramChatStep from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/steps/TelegramChatStep.svelte';
  import TelegramSetupStep from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/steps/TelegramSetupStep.svelte';

  type Props = {
    clusterId: string;
    onCancel: () => void;
    onDone: () => void;
  };

  const { clusterId, onCancel, onDone }: Props = $props();

  function onBackToChannels(): void {
    onCancel();
    telegramSetupState.close();
  }

  async function onChannelSetupSubmit(): Promise<void> {
    const createdChannelId = await notificationChannelsState.createChannel(
      clusterId,
      {
        type: 'telegram',
        name: telegramSetupState.state.chatName,
        options: {
          chatId: telegramSetupState.state.chatId,
        },
      },
    );

    if (!createdChannelId) {
      return;
    }

    onDone();
    void notificationChannelsState.loadChannels(clusterId);
    void monitoringState.load(clusterId);
  }
</script>

{#if telegramSetupState.state.currentStep === 'setup'}
  <TelegramSetupStep
    passphrase={telegramSetupState.state.passphrase}
    onBack={onBackToChannels}
    onNext={() => telegramSetupState.startWaiting()}
  />
{:else}
  <TelegramChatStep
    passphrase={telegramSetupState.state.passphrase}
    chatName={telegramSetupState.state.chatName}
    found={telegramSetupState.state.currentStep === 'success'}
    onBack={() => telegramSetupState.goBackToSetup()}
    onSubmit={onChannelSetupSubmit}
  />
{/if}
