<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { notificationChannelsState } from '$lib/clusters/projects/application/notification-channels/notification-channels.state.svelte';
  import { telegramSetupState } from '$lib/clusters/projects/application/telegram/telegram-setup.state.svelte';
  import Modal from '$lib/shared/ui/Modal.svelte';
  import { onMount } from 'svelte';
  import TelegramErrorStep from './steps/TelegramErrorStep.svelte';
  import TelegramSetupStep from './steps/TelegramSetupStep.svelte';
  import TelegramSuccessStep from './steps/TelegramSuccessStep.svelte';
  import TelegramWaitingStep from './steps/TelegramWaitingStep.svelte';

  interface Props {
    clusterId: string;
  }

  let { clusterId }: Props = $props();

  function closeModal() {
    console.log('Closing modal');
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

  function handleChannelCreated() {
    // Close the modal and redirect to notifications page
    telegramSetupState.close();

    // Check if we're already on the notifications page
    const isOnNotificationsPage = page.url.pathname.includes('/notifications');

    if (!isOnNotificationsPage) {
      // Redirect to notifications page
      goto(`/app/clusters/${clusterId}/notifications`);
    } else {
      // If we're already on the notifications page, just reload the channels
      notificationChannelsState.loadChannels(clusterId);
    }
  }

  // Use effect to trigger channel creation when chat is detected
  $effect(() => {
    if (
      telegramSetupState.state.chatId &&
      telegramSetupState.state.currentStep === 'waiting'
    ) {
      telegramSetupState.createNotificationChannelForCluster(clusterId);
    }
  });

  onMount(() => {
    telegramSetupState.bind({
      onChannelCreated: async (channelId: string, chatName: string) => {
        console.log('Channel created successfully:', channelId, chatName);

        // Create a notification channel object from the data we have
        const newChannel = {
          id: channelId,
          clusterId: clusterId,
          target: 'telegram' as const,
          options: {
            chatId: telegramSetupState.state.chatId,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        notificationChannelsState.addChannel(newChannel);
        handleChannelCreated();
      },
    });

    return () => {
      telegramSetupState.destroy();
    };
  });
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
      chatName={telegramSetupState.state.chatName}
      onDone={closeModal}
    />
  {:else if telegramSetupState.state.currentStep === 'error'}
    <TelegramErrorStep
      errorMessage={telegramSetupState.state.errorMessage}
      onCancel={closeModal}
      onRetry={retry}
    />
  {/if}
</Modal>
