<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import { telegramSetupState } from '$lib/domains/app/projects/application/notification-channels/telegram-setup.state.svelte.js';
  import TelegramErrorStep from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/steps/TelegramErrorStep.svelte';
  import TelegramSetupStep from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/steps/TelegramSetupStep.svelte';
  import TelegramSuccessStep from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/steps/TelegramSuccessStep.svelte';
  import TelegramWaitingStep from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/steps/TelegramWaitingStep.svelte';

  type Props = {
    clusterId: string;
    onCancel?: () => void;
  };

  const { clusterId, onCancel }: Props = $props();

  function closeModal() {
    onCancel?.();
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

  function onChannelSetupSubmit(shouldAssignToServiceMonitor: boolean) {
    notificationChannelsState
      .createChannel(clusterId, {
        type: 'telegram',
        name: telegramSetupState.state.chatName,
        options: {
          chatId: telegramSetupState.state.chatId,
        },
      })
      .then((createdChannelId: string) => {
        if (shouldAssignToServiceMonitor) {
          monitoringState.addNotificationChannel(
            telegramSetupState.state.monitorId,
            createdChannelId,
          );
        }
        telegramSetupState.close();
        notificationChannelsState.loadChannels(clusterId);
      });
  }
</script>

<!-- <Modal isOpen={telegramSetupState.state.isOpen} onClose={closeModal}> -->
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
    monitorName={monitoringState.getMonitorById(
      telegramSetupState.state.monitorId,
    )?.name || ''}
  />
{:else if telegramSetupState.state.currentStep === 'error'}
  <TelegramErrorStep
    errorMessage={telegramSetupState.state.errorMessage}
    onCancel={closeModal}
    onRetry={retry}
  />
{/if}
<!-- </Modal> -->
