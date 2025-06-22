<script lang="ts">
  import { notificationChannelsState } from '$lib/clusters/projects/application/notification-channels/notification-channels.state.svelte';
  import { telegramSetupState } from '$lib/clusters/projects/application/telegram/telegram-setup.state.svelte';
  import type { NotificationChannel } from '$lib/clusters/projects/domain/telegram/telegram.types';
  import { onMount } from 'svelte';

  interface Props {
    clusterId: string;
  }

  let { clusterId }: Props = $props();

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
    if (channel.target === 'telegram') {
      // Try to get chat name from options or use a default
      return channel.options.chatId ? `Telegram Chat` : 'Telegram';
    }
    if (channel.target === 'webhook') {
      return channel.options.url
        ? `Webhook (${new URL(channel.options.url).hostname})`
        : 'Webhook';
    }
    return channel.target;
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
        `Are you sure you want to delete this ${channel.target} notification channel?`,
      )
    ) {
      await notificationChannelsState.deleteChannel(clusterId, channel.id);
    }
  }

  function handleSetupNewChannel(): void {
    telegramSetupState.startSetup();
  }

  onMount(() => {
    notificationChannelsState.loadChannels(clusterId);
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Notification Channels
      </h2>
      <p class="mt-1 text-gray-600 dark:text-gray-400">
        Manage how you receive alerts and notifications
      </p>
    </div>

    <button
      onclick={handleSetupNewChannel}
      class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <span class="mr-2">+</span>
      Add Channel
    </button>
  </div>

  <!-- Loading State -->
  {#if notificationChannelsState.state.isLoading}
    <div class="flex items-center justify-center py-12">
      <div
        class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"
      ></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">
        Loading channels...
      </span>
    </div>

    <!-- Error State -->
  {:else if notificationChannelsState.state.error}
    <div
      class="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-red-400">⚠️</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-400">
            Error loading notification channels
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            {notificationChannelsState.state.error}
          </div>
          <div class="mt-4">
            <button
              onclick={() => notificationChannelsState.loadChannels(clusterId)}
              class="rounded bg-red-100 px-3 py-1 text-sm text-red-800 transition-colors hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
  {:else if notificationChannelsState.state.channels.length === 0}
    <div class="py-12 text-center">
      <div class="mb-4 text-6xl">📢</div>
      <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
        No notification channels configured
      </h3>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Set up your first notification channel to receive alerts and updates.
      </p>
      <button
        onclick={handleSetupNewChannel}
        class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span class="mr-2">+</span>
        Setup Telegram Notifications
      </button>
    </div>

    <!-- Channels List -->
  {:else}
    <div class="grid gap-4">
      {#each notificationChannelsState.state.channels as channel (channel.id)}
        <div
          class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <span class="text-2xl">{getChannelIcon(channel)}</span>
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {getChannelDisplayName(channel)}
                </h3>

                <div class="mt-2 space-y-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Type:</span>
                    {channel.target}
                  </p>

                  {#if channel.target === 'telegram' && channel.options.chatId}
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      <span class="font-medium">Chat ID:</span>
                      {channel.options.chatId}
                    </p>
                  {/if}

                  {#if channel.target === 'webhook' && channel.options.url}
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      <span class="font-medium">URL:</span>
                      {channel.options.url}
                    </p>
                  {/if}

                  <p class="text-sm text-gray-500 dark:text-gray-500">
                    Created {formatDate(channel.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex-shrink-0">
              <button
                onclick={() => handleDelete(channel)}
                class="text-sm font-medium text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
