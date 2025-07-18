<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelSetupState } from '$lib/domains/app/projects/application/notification-channels/notification-channel-setup.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import type { NotificationChannel } from '$lib/domains/app/projects/domain/telegram/telegram.types.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { BellIcon, PlusIcon, Trash2Icon } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  type Props = {
    clusterId: string;
    monitorId: string;
  };
  const { clusterId, monitorId }: Props = $props();

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getChannelDisplayName(channel: NotificationChannel): string {
    return channel.name || `${channel.target} Channel`;
  }

  function getChannelIcon(channel: NotificationChannel): string {
    if (channel.target === 'telegram') {
      return '📱';
    }
    if (channel.target === 'webhook') {
      return '🔗';
    }
    return '📢';
  }

  async function handleDelete(channel: NotificationChannel): Promise<void> {
    if (
      confirm(
        `Are you sure you want to delete ${getChannelDisplayName(channel)} notification channel?`,
      )
    ) {
      await notificationChannelsState.deleteChannel(channel.id);
    }
  }

  onMount(() => {
    notificationChannelsState.loadChannels(clusterId);
  });
</script>

{#snippet menu(close: () => void)}
  <div
    class="dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    <ul class="">
      {#each notificationChannelsState.state.channels as channel (channel.id)}
        <li
          class="hover:bg-base-100 flex items-center justify-center gap-2 rounded-lg px-3 pr-1"
        >
          <button
            in:fly={{ y: -2, duration: 100 }}
            onclick={() =>
              monitoringState.toggleNotificationChannel(monitorId, channel.id)}
            class="flex w-full cursor-pointer flex-col items-start justify-center gap-1 py-2.5"
          >
            <span class="flex items-center gap-4">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-secondary"
                checked={monitoringState.hasNotificationChannel(
                  monitorId,
                  channel.id,
                )}
                readonly
              />
              {getChannelDisplayName(channel)}
            </span>

            <div class="space-y-1">
              {#if channel.target === 'telegram' && channel.options.chatId}
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  <span class="font-medium">id:</span>
                  {channel.options.chatId}
                </p>
              {/if}

              {#if channel.target === 'webhook' && channel.options.url}
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  <span class="font-medium">URL:</span>
                  {channel.options.url}
                </p>
              {/if}
            </div>
          </button>

          <button
            onclick={() => handleDelete(channel)}
            class="btn btn-transparent btn-square text-error p-0"
          >
            <Trash2Icon class="h-5 w-5" />
          </button>
        </li>
      {/each}

      <li
        class="hover:bg-base-100 flex items-center justify-start rounded-lg px-3"
      >
        <button
          in:fly={{ y: -2, duration: 100 }}
          onclick={() => {
            notificationChannelSetupState.open(monitorId);
            close();
          }}
          class="btn btn-transparent flex w-full items-center justify-start gap-4 px-0"
        >
          <PlusIcon class="h-5 w-5" />
          Connect new channel
        </button>
      </li>
    </ul>
  </div>
{/snippet}

<Tooltip
  align="right"
  class="w-full"
  content={menu}
  interactive={true}
  placement="bottom"
>
  <button
    class="btn btn-outline btn-subtle btn-sm w-full gap-1"
    data-posthog-id="connect-notification-channel-button"
    onclick={(e) => {
      e.stopPropagation();
    }}
  >
    Connect notification channel
    <BellIcon class="h-4 w-4" />
  </button>
</Tooltip>
