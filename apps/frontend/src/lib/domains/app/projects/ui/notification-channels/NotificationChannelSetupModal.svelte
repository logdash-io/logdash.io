<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import {
    telegramSetupState,
  } from '$lib/domains/app/projects/application/notification-channels/telegram-setup.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { NotificationChannelType } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { BellIcon, LinkIcon, SendIcon } from 'lucide-svelte';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import {
    notificationChannelSetupState,
  } from '$lib/domains/app/projects/application/notification-channels/notification-channel-setup.state.svelte.js';
  import {
    notificationChannelsState,
  } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import TelegramAlertingSetup
    from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/TelegramAlertingSetup.svelte';
  import WebhookSetupStep
    from '$lib/domains/app/projects/ui/notification-channels/webhook-setup/WebhookSetupStep.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();
  const userTier = $derived(userState.tier);
  const allowedNotificationChannels = $derived(
    exposedConfigState.allowedNotificationChannels(userTier),
  );

  const availableChannels = $state([
    {
      id: NotificationChannelType.TELEGRAM,
      name: 'Telegram',
      onclick: () => {
        const monitorId = notificationChannelSetupState.state.monitorId;
        telegramSetupState.startSetup(monitorId);
      },
      icon: SendIcon,
    },
    {
      id: NotificationChannelType.WEBHOOK,
      name: 'Webhook',
      onclick: () => {
        // notificationChannelSetupState.startWebhookSetup();
      },
      icon: LinkIcon,
    },
  ]);
  let selectedChannel: string | null = $state(null);

  function closeModal() {
    notificationChannelSetupState.close();
  }
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
        <UpgradeElement
          class="w-full"
          enabled={!allowedNotificationChannels.includes(channel.id)}
          source="notification-channel-setup"
        >
          <div
            class="hover:bg-secondary/10 flex cursor-pointer items-center justify-start gap-4 rounded-xl px-4 py-3 select-none"
            onclick={() => {
              if (!allowedNotificationChannels.includes(channel.id)) {
                return;
              }

              selectedChannel = channel.id;
              channel.onclick?.();
            }}
          >
            <channel.icon class="text-secondary ml-2 inline h-4 w-4" />
            <span>{channel.name}</span>

            {#if !allowedNotificationChannels.includes(channel.id)}
              {#snippet upgradeText()}
                {@const requiredTier =
                  exposedConfigState.firstTierWithNotificationChannel(
                    channel.id,
                  )}
                {requiredTier
                  ? `Upgrade to ${exposedConfigState.formatTierName(requiredTier)}`
                  : 'Upgrade Tier'}
              {/snippet}

              <div
                class="badge badge-primary badge-soft badge-sm ml-auto capitalize"
              >
                {@render upgradeText()}
              </div>
            {/if}
          </div>
        </UpgradeElement>
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
      {userTier}
      onSubmit={(dto: {
        withAssignment: boolean;
        url: string;
        name: string;
        headers: Record<string, string>;
        method: string;
      }) => {
        notificationChannelsState
          .createChannel(clusterId, {
            type: 'webhook',
            name: dto.name,
            options: {
              url: dto.url,
              headers: dto.headers,
              method: dto.method,
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
