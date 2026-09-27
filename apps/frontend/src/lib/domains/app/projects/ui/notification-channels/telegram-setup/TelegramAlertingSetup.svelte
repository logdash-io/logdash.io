<script lang="ts">
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
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

  const monitorName = $derived.by(() => {
    const monitorId = telegramSetupState.state.monitorId;

    if (!monitorId) {
      return '';
    }

    return monitoringState.getMonitorById(monitorId)?.name || '';
  });

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

  async function onChannelSetupSubmit(
    shouldAssignToServiceMonitor: boolean,
  ): Promise<void> {
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
    const monitorId = telegramSetupState.state.monitorId;

    if (shouldAssignToServiceMonitor && monitorId && createdChannelId) {
      void assignChannelToMonitor(monitorId, createdChannelId);
    }
    telegramSetupState.close();
    void notificationChannelsState.loadChannels(clusterId);
  }

  async function assignChannelToMonitor(
    monitorId: string,
    channelId: string,
  ): Promise<void> {
    try {
      await monitoringState.addNotificationChannel(monitorId, channelId);
    } catch {
      toast.error('Failed to add notification channel to monitor');
    }
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
    {monitorName}
  />
{:else if telegramSetupState.state.currentStep === 'error'}
  <TelegramErrorStep
    errorMessage={telegramSetupState.state.errorMessage}
    onCancel={closeModal}
    onRetry={retry}
  />
{/if}
<!-- </Modal> -->
