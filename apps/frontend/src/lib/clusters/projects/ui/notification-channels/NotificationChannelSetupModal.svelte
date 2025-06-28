<script lang="ts">
  import { telegramSetupState } from '$lib/clusters/projects/application/notification-channels/telegram-setup.state.svelte';
  import Modal from '$lib/shared/ui/Modal.svelte';
  import { BellIcon, LinkIcon, SendIcon } from 'lucide-svelte';
  import { notificationChannelSetupState } from '../../application/notification-channels/notification-channel-setup.state.svelte.js';
  import TelegramAlertingSetup from './telegram-setup/TelegramAlertingSetup.svelte';
  import WebhookSetupStep from './webhook-setup/WebhookSetupStep.svelte';
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
  import { monitoringState } from '../../application/monitoring.state.svelte.js';
  import { notificationChannelsState } from '../../application/notification-channels/notification-channels.state.svelte.js';
  import { UserTier } from '$lib/shared/types.js';
  import { userState } from '$lib/shared/user/application/user.state.svelte.js';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();
  const userTier = $derived(userState.tier);
  const availableChannels = $state([
    {
      id: 'telegram',
      name: 'Telegram',
      includedTiers: [],
      extraTiers: [],
      onclick: () => {
        const monitorId = notificationChannelSetupState.state.monitorId;
        telegramSetupState.startSetup(monitorId);
      },
      icon: SendIcon,
    },
    {
      id: 'webhook',
      name: 'Webhook',
      includedTiers: [UserTier.EARLY_BIRD, UserTier.PRO],
      extraTiers: [UserTier.CONTRIBUTOR],
      onclick: () => {
        // notificationChannelSetupState.startWebhookSetup();
      },
      icon: LinkIcon,
    },
    // { id: 'email', name: 'Email' },
  ]);
  let selectedChannel: string | null = $state(null);

  function closeModal() {
    notificationChannelSetupState.close();
  }

  const channelUnavailable = (channel: (typeof availableChannels)[number]) => {
    return (
      channel.includedTiers.length &&
      !channel.includedTiers.includes(userTier) &&
      !channel.extraTiers.includes(userTier)
    );
  };

  const isFreeChannel = (channel: (typeof availableChannels)[number]) => {
    return !channel.includedTiers.length;
  };
</script>

{#snippet base()}
  <div class="space-y-6">
    <div class="flex items-center justify-start gap-4">
      <div
        class="bg-base-300 border-base-100 text-primary-content flex h-14 w-14 items-center justify-center rounded-full border"
      >
        <BellIcon class="h-6 w-6" />
      </div>

      <div class="flex flex-col items-start">
        <h3 class="text-xl font-semibold">Setup alerting channel</h3>
        <p class="text-secondary/70 text-sm">
          Choose from options below to set up your alerting channel.
        </p>
      </div>
    </div>

    <div class="flex flex-col">
      {#each availableChannels as channel (channel.id)}
        <div
          class="hover:bg-secondary/10 flex cursor-pointer select-none items-center justify-start gap-4 rounded-xl px-4 py-3"
          onclick={() => {
            if (channelUnavailable(channel)) {
              return;
            }

            selectedChannel = channel.id;
            channel.onclick?.();
          }}
        >
          <channel.icon class="text-secondary ml-2 inline h-4 w-4" />
          <span>{channel.name}</span>

          {#if isFreeChannel(channel)}
            <div class="ml-auto">
              <div class="badge badge-secondary badge-soft badge-sm">Free</div>
            </div>
          {/if}

          {#if channelUnavailable(channel)}
            <div
              class="badge badge-primary badge-soft badge-sm ml-auto capitalize"
            >
              {userState.humanReadableTier(channel.includedTiers[0])}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="flex gap-3">
      <button
        type="button"
        class="btn btn-secondary btn-soft flex-1"
        onclick={closeModal}
      >
        Cancel
      </button>
    </div>
  </div>
{/snippet}

<Modal isOpen={notificationChannelSetupState.isOpen} onClose={closeModal}>
  {#if !selectedChannel}
    {@render base()}
  {/if}

  {#if selectedChannel === 'telegram'}
    <TelegramAlertingSetup
      onCancel={() => {
        selectedChannel = null;
      }}
      {clusterId}
    />
  {/if}

  {#if selectedChannel === 'webhook'}
    <WebhookSetupStep
      clusterName={clustersState.clusterName(clusterId)}
      monitorName={monitoringState.getMonitorById(
        notificationChannelSetupState.state.monitorId,
      )?.name || ''}
      onSubmit={(dto: {
        withAssignment: boolean;
        url: string;
        name: string;
      }) => {
        notificationChannelsState
          .createChannel(clusterId, {
            type: 'webhook',
            name: dto.name,
            options: {
              url: dto.url,
            },
          })
          .then((createdChannelId: string) => {
            if (dto.withAssignment) {
              monitoringState.addNotificationChannel(
                notificationChannelSetupState.state.monitorId,
                createdChannelId,
              );
            }
            notificationChannelSetupState.close();
            selectedChannel = null;
            notificationChannelsState.loadChannels(clusterId);
          });
      }}
      onCancel={() => {
        selectedChannel = null;
      }}
    />
  {/if}
</Modal>
