<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelSetupState } from '$lib/domains/app/projects/application/notification-channels/notification-channel-setup.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import {
    getChannelDisplayName,
    getChannelTypeLabel,
  } from '$lib/domains/app/projects/domain/notification-channels/channel-display.js';
  import type { NotificationChannel } from '$lib/domains/app/projects/domain/telegram/telegram.types.js';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import {
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { Button, Checkbox } from '@logdash/hyper-ui/presentational';

  type Props = {
    monitorId: string;
  };

  const { monitorId }: Props = $props();

  const channels = $derived(notificationChannelsState.state.channels);

  async function onToggleChannel(channelId: string): Promise<void> {
    try {
      await monitoringState.toggleNotificationChannel(monitorId, channelId);
    } catch {
      toast.error('Failed to update notification channel');
    }
  }

  async function onDeleteChannel(channel: NotificationChannel): Promise<void> {
    const confirmed = confirm(
      `Are you sure you want to delete ${getChannelDisplayName(channel)} notification channel?`,
    );

    if (!confirmed) {
      return;
    }

    await notificationChannelsState.deleteChannel(channel.id);
  }

  function onAddChannel(): void {
    notificationChannelSetupState.open(monitorId);
  }

  function channelDetails(channel: NotificationChannel): string {
    const target =
      channel.target === 'telegram'
        ? channel.options.chatId && `id: ${channel.options.chatId}`
        : channel.options.url;

    return [getChannelTypeLabel(channel), target].filter(Boolean).join(' · ');
  }
</script>

<SettingsCard title="Alerts" description="Where down and recovery alerts go.">
  {#each channels as channel (channel.id)}
    <SettingsCardItem>
      <label class="flex min-w-0 cursor-pointer items-center gap-3">
        <Checkbox
          size="xs"
          variant="primary"
          checked={monitoringState.hasNotificationChannel(
            monitorId,
            channel.id,
          )}
          onchange={() => onToggleChannel(channel.id)}
        />

        <span class="flex min-w-0 flex-col">
          <span class="truncate">{getChannelDisplayName(channel)}</span>
          <span class="text-neutral-500 truncate">
            {channelDetails(channel)}
          </span>
        </span>
      </label>

      {#snippet action()}
        <IconButton
          label="Delete {getChannelDisplayName(channel)}"
          tooltip="Delete channel"
          danger
          class="-mr-1.5"
          onclick={() => onDeleteChannel(channel)}
        >
          <TrashIcon class="size-4" />
        </IconButton>
      {/snippet}
    </SettingsCardItem>
  {/each}

  <SettingsCardItem>
    <p class="text-neutral-500">Telegram or any webhook.</p>

    {#snippet action()}
      <Button variant="neutral" size="sm" onclick={onAddChannel}>
        <PlusIcon class="size-4" />
        Add channel
      </Button>
    {/snippet}
  </SettingsCardItem>
</SettingsCard>
