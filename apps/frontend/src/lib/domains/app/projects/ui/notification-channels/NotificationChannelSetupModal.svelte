<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { telegramSetupState } from '$lib/domains/app/projects/application/notification-channels/telegram-setup.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { NotificationChannelType } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import BellIcon from '$lib/domains/shared/icons/BellIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import LinkIcon from '$lib/domains/shared/icons/LinkIcon.svelte';
  import SendIcon from '$lib/domains/shared/icons/SendIcon.svelte';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelSetupState } from '$lib/domains/app/projects/application/notification-channels/notification-channel-setup.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import TelegramAlertingSetup from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/TelegramAlertingSetup.svelte';
  import WebhookSetupStep from '$lib/domains/app/projects/ui/notification-channels/webhook-setup/WebhookSetupStep.svelte';
  import type { WebhookSetupDTO } from '$lib/domains/app/projects/domain/notification-channels/notification-channels.types.js';
  import { Badge, Button } from '@logdash/hyper-ui/presentational';

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
      onclick: () => telegramSetupState.startSetup(),
      icon: SendIcon,
    },
    {
      id: NotificationChannelType.WEBHOOK,
      name: 'Webhook',
      onclick: () => undefined,
      icon: LinkIcon,
    },
  ]);
  const selectedChannel = $derived(notificationChannelSetupState.channel);

  function closeModal(): void {
    notificationChannelSetupState.close();
    telegramSetupState.stopPolling();
  }

  function onBackToChannels(): void {
    notificationChannelSetupState.selectChannel(null);
  }

  async function onWebhookSubmit(dto: WebhookSetupDTO): Promise<void> {
    const createdChannelId = await notificationChannelsState.createChannel(
      clusterId,
      {
        type: 'webhook',
        name: dto.name,
        options: {
          url: dto.url,
          headers: dto.headers,
          method: dto.method,
        },
      },
    );

    if (!createdChannelId) {
      return;
    }

    closeModal();
    void notificationChannelsState.loadChannels(clusterId);
    void monitoringState.load(clusterId);
  }
</script>

{#snippet base()}
  <div class="flex flex-col gap-5">
    <div class="flex items-center gap-4">
      <div
        class="bg-surface-150-bg flex size-9 shrink-0 items-center justify-center rounded-lg"
      >
        <BellIcon class="size-4.5" />
      </div>
      <div class="flex min-w-0 flex-col gap-0.5">
        <h2 class="text-base font-semibold">Add a notification channel</h2>
        <p class="text-fg-tertiary text-sm">
          Every monitor on this domain alerts it.
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-0.5">
      {#each availableChannels as channel (channel.id)}
        <UpgradeElement
          class="w-full"
          enabled={!allowedNotificationChannels.includes(channel.id)}
          source="notification-channel-setup"
        >
          <button
            type="button"
            class="hover:bg-surface-elevated-hover-bg focus-visible:bg-surface-elevated-hover-bg flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm outline-none select-none"
            onclick={() => {
              if (!allowedNotificationChannels.includes(channel.id)) {
                return;
              }

              notificationChannelSetupState.selectChannel(channel.id);
              channel.onclick?.();
            }}
          >
            <channel.icon class="text-fg-secondary size-4 shrink-0" />
            <span>{channel.name}</span>

            {#if !allowedNotificationChannels.includes(channel.id)}
              {#snippet upgradeText()}
                {@const requiredTier =
                  exposedConfigState.firstTierWithNotificationChannel(
                    channel.id,
                  )}
                {requiredTier
                  ? `Upgrade to ${exposedConfigState.formatTierName(requiredTier)}`
                  : 'Upgrade'}
              {/snippet}

              <Badge size="sm" class="ml-auto">
                {@render upgradeText()}
              </Badge>
            {:else}
              <ChevronRightIcon class="text-fg-muted ml-auto size-3.5" />
            {/if}
          </button>
        </UpgradeElement>
      {/each}
    </div>

    <div class="flex justify-end">
      <Button variant="ghost" onclick={closeModal}>Cancel</Button>
    </div>
  </div>
{/snippet}

<Modal isOpen={notificationChannelSetupState.isOpen} onClose={closeModal}>
  {#if !selectedChannel}
    {@render base()}
  {/if}

  {#if selectedChannel === NotificationChannelType.TELEGRAM}
    <TelegramAlertingSetup
      onCancel={onBackToChannels}
      onDone={closeModal}
      {clusterId}
    />
  {/if}

  {#if selectedChannel === NotificationChannelType.WEBHOOK}
    <WebhookSetupStep
      clusterName={clustersState.clusterName(clusterId)}
      onSubmit={onWebhookSubmit}
      onCancel={onBackToChannels}
    />
  {/if}
</Modal>
