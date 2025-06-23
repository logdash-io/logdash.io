<script lang="ts">
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
  import { notificationChannelsState } from '$lib/clusters/projects/application/notification-channels/notification-channels.state.svelte';
  import { telegramSetupState } from '$lib/clusters/projects/application/telegram/telegram-setup.state.svelte';
  import Modal from '$lib/shared/ui/Modal.svelte';
  import TelegramErrorStep from './steps/TelegramErrorStep.svelte';
  import TelegramSetupStep from './steps/TelegramSetupStep.svelte';
  import TelegramSuccessStep from './steps/TelegramSuccessStep.svelte';
  import TelegramWaitingStep from './steps/TelegramWaitingStep.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  function closeModal() {
    telegramSetupState.close();
  }

  function startWaiting() {
    telegramSetupState.startWaiting();
  }

  function goBackToSetup() {
    telegramSetupState.goBackToSetup();
  }

  function retry() {
    telegramSetupState.retry();
  }

  function onChannelSetupSubmit() {
    notificationChannelsState
      .createChannel(clusterId, {
        type: 'telegram',
        name: telegramSetupState.state.chatName,
        options: {
          chatId: telegramSetupState.state.chatId,
        },
      })
      .then(() => {
        telegramSetupState.close();
        notificationChannelsState.loadChannels(clusterId);
      });
  }
</script>

<Modal isOpen={telegramSetupState.state.isOpen} onClose={closeModal}>
  {#if telegramSetupState.state.currentStep === 'setup'}
    <TelegramSetupStep
      passphrase={telegramSetupState.state.passphrase}
      onCancel={closeModal}
      onNext={startWaiting}
    />
  {:else if telegramSetupState.state.currentStep === 'waiting'}
    <TelegramWaitingStep
      passphrase={telegramSetupState.state.passphrase}
      onCancel={closeModal}
      onBack={goBackToSetup}
    />
  {:else if telegramSetupState.state.currentStep === 'success'}
    <TelegramSuccessStep
      clusterName={clustersState.clusterName(clusterId)}
      chatName={telegramSetupState.state.chatName}
      onSubmit={onChannelSetupSubmit}
    />
  {:else if telegramSetupState.state.currentStep === 'error'}
    <TelegramErrorStep
      errorMessage={telegramSetupState.state.errorMessage}
      onCancel={closeModal}
      onRetry={retry}
    />
  {/if}
</Modal>
