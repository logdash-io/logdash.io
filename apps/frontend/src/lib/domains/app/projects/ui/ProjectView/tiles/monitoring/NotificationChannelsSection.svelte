<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelSetupState } from '$lib/domains/app/projects/application/notification-channels/notification-channel-setup.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import type { NotificationChannel } from '$lib/domains/app/projects/domain/telegram/telegram.types.js';
  import {
    getChannelDisplayName,
    getChannelTypeLabel,
  } from '$lib/domains/app/projects/domain/notification-channels/channel-display.js';
  import {
    SettingsCardExpandable,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import BellIcon from '$lib/domains/shared/icons/BellIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';

  type Props = {
    monitorId: string;
  };

  const { monitorId }: Props = $props();

  const channels = $derived(notificationChannelsState.state.channels);

  async function onDeleteChannel(channel: NotificationChannel): Promise<void> {
    const confirmed = confirm(
      `Are you sure you want to delete ${getChannelDisplayName(channel)} notification channel?`,
    );

    if (!confirmed) {
      return;
    }

    await notificationChannelsState.deleteChannel(channel.id);
  }

  function onToggleChannel(channelId: string): void {
    monitoringState.toggleNotificationChannel(monitorId, channelId);
  }

  function onAddChannel(): void {
    notificationChannelSetupState.open(monitorId);
  }
</script>

<SettingsCardExpandable
  title="Notification Channels"
  description="Configure alerts for monitor status changes"
  icon={BellIcon}
>
  {#each channels as channel (channel.id)}
    {@const isEnabled = monitoringState.hasNotificationChannel(
      monitorId,
      channel.id,
    )}
    <SettingsCardItem
      showBorder={true}
      onclick={() => onToggleChannel(channel.id)}
    >
      {#snippet children()}
        <div class="flex items-center gap-4">
          <div
            class="size-10 rounded-lg bg-base-100 flex items-center justify-center"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-xs checkbox-secondary"
              checked={isEnabled}
              readonly
            />
          </div>
          <div>
            <p class="font-medium text-sm">{getChannelDisplayName(channel)}</p>
            <p class="text-base-content/60 text-sm">
              {getChannelTypeLabel(channel)}
              {#if channel.target === 'telegram' && channel.options.chatId}
                · id: {channel.options.chatId}
              {/if}
              {#if channel.target === 'webhook' && channel.options.url}
                · {channel.options.url}
              {/if}
            </p>
          </div>
        </div>
      {/snippet}
      {#snippet action()}
        <button
          onclick={(e) => {
            e.stopPropagation();
            onDeleteChannel(channel);
          }}
          class="btn btn-ghost border-0 btn-sm text-error bg-error/10 btn-square"
        >
          <TrashIcon class="size-4" />
        </button>
      {/snippet}
    </SettingsCardItem>
  {/each}

  <SettingsCardItem icon={PlusIcon} showBorder={false} onclick={onAddChannel}>
    {#snippet children()}
      <p class="font-medium">Add notification channel</p>
      <p class="text-base-content/60 text-sm">
        Connect Telegram or Webhook notifications
      </p>
    {/snippet}
  </SettingsCardItem>
</SettingsCardExpandable>
