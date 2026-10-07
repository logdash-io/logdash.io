<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelSetupState } from '$lib/domains/app/projects/application/notification-channels/notification-channel-setup.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import {
    getChannelDisplayName,
    getChannelTypeLabel,
  } from '$lib/domains/app/projects/domain/notification-channels/channel-display.js';
  import type { NotificationChannel } from '$lib/domains/app/projects/domain/telegram/telegram.types.js';
  import NotificationChannelSetupModal from '$lib/domains/app/projects/ui/notification-channels/NotificationChannelSetupModal.svelte';
  import BellIcon from '$lib/domains/shared/icons/BellIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import {
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { onMount } from 'svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const channels = $derived(notificationChannelsState.state.channels);

  onMount(() => {
    void notificationChannelsState.loadChannels(clusterId);
  });

  async function onDeleteChannel(channel: NotificationChannel): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Delete alert channel',
      description: `${getChannelDisplayName(channel)} stops receiving alerts from every monitor. This cannot be undone.`,
      confirmLabel: 'Delete channel',
    });

    if (!confirmed) {
      return;
    }

    await notificationChannelsState.deleteChannel(channel.id);
    void monitoringState.load(clusterId);
  }
</script>

<NotificationChannelSetupModal {clusterId} />

<SettingsCard
  title="Alerts"
  icon={BellIcon}
  description="Every monitor on this domain alerts these channels. Turn one off for a single monitor on its page."
>
  {#each channels as channel (channel.id)}
    <SettingsCardItem>
      <div class="flex min-w-0 flex-col">
        <span class="truncate">{getChannelDisplayName(channel)}</span>
        <span class="ph-no-capture text-fg-muted truncate">
          {getChannelTypeLabel(channel)}
        </span>
      </div>

      {#snippet action()}
        <IconButton
          label="Delete {getChannelDisplayName(channel)}"
          tooltip="Delete channel"
          danger
          well
          class="-mr-1.5"
          onclick={() => onDeleteChannel(channel)}
        >
          <TrashIcon class="size-4" />
        </IconButton>
      {/snippet}
    </SettingsCardItem>
  {/each}

  <SettingsCardItem>
    <p class="text-fg-muted">Telegram or any webhook.</p>

    {#snippet action()}
      <Button size="sm" onclick={() => notificationChannelSetupState.open()}>
        <PlusIcon class="size-4" />
        Add channel
      </Button>
    {/snippet}
  </SettingsCardItem>
</SettingsCard>
