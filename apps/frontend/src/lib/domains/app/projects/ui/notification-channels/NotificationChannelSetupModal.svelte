<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import { prefersReducedMotion } from 'svelte/motion';
  import { match } from 'ts-pattern';
  import { telegramSetupState } from '$lib/domains/app/projects/application/notification-channels/telegram-setup.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { NotificationChannelType } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import LinkIcon from '$lib/domains/shared/icons/LinkIcon.svelte';
  import SendIcon from '$lib/domains/shared/icons/SendIcon.svelte';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelSetupState } from '$lib/domains/app/projects/application/notification-channels/notification-channel-setup.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import ChannelSetupStep from '$lib/domains/app/projects/ui/notification-channels/ChannelSetupStep.svelte';
  import TelegramAlertingSetup from '$lib/domains/app/projects/ui/notification-channels/telegram-setup/TelegramAlertingSetup.svelte';
  import WebhookSetupStep from '$lib/domains/app/projects/ui/notification-channels/webhook-setup/WebhookSetupStep.svelte';
  import type {
    WebhookSetupDTO,
    WebhookStep,
  } from '$lib/domains/app/projects/domain/notification-channels/notification-channels.types.js';
  import { Badge } from '@logdash/hyper-ui/presentational';

  type Props = {
    clusterId: string;
  };

  const TOTAL_STEPS = 3;

  const { clusterId }: Props = $props();
  const userTier = $derived(userState.tier);
  const allowedNotificationChannels = $derived(
    exposedConfigState.allowedNotificationChannels(userTier),
  );

  let webhookStep = $state<WebhookStep>('endpoint');

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
      onclick: () => (webhookStep = 'endpoint'),
      icon: LinkIcon,
    },
  ]);
  const selectedChannel = $derived(notificationChannelSetupState.channel);
  const step = $derived(
    match(selectedChannel)
      .with(NotificationChannelType.TELEGRAM, () =>
        telegramSetupState.state.currentStep === 'setup' ? 2 : 3,
      )
      .with(NotificationChannelType.WEBHOOK, () =>
        webhookStep === 'endpoint' ? 2 : 3,
      )
      .otherwise(() => 1),
  );

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

  function slideOnStepChange(): Attachment<HTMLElement> {
    let previousStep: number | undefined;

    return (node) => {
      const direction = Math.sign(step - (previousStep ?? step));
      previousStep = step;

      if (direction === 0 || prefersReducedMotion.current) {
        return;
      }

      node.animate(
        [
          { opacity: 0, transform: `translateX(${direction * 12}px)` },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 250, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
    };
  }
</script>

<Modal
  isOpen={notificationChannelSetupState.isOpen}
  onClose={closeModal}
  class="w-md p-6"
  aria-labelledby="notification-channel-setup-title"
>
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <span class="text-fg-muted text-sm">Step {step} of {TOTAL_STEPS}</span>
      <div class="flex items-center gap-3" aria-hidden="true">
        {#each { length: TOTAL_STEPS }, index (index)}
          <span
            class={[
              'h-1.5 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none',
              {
                'bg-surface-inverse-bg w-4': index + 1 === step,
                'bg-surface-200-bg w-1.5': index + 1 !== step,
              },
            ]}
          ></span>
        {/each}
      </div>
    </div>

    <div {@attach slideOnStepChange()}>
      {#if selectedChannel === NotificationChannelType.TELEGRAM}
        <TelegramAlertingSetup
          onCancel={onBackToChannels}
          onDone={closeModal}
          {clusterId}
        />
      {:else if selectedChannel === NotificationChannelType.WEBHOOK}
        <WebhookSetupStep
          bind:step={webhookStep}
          onSubmit={onWebhookSubmit}
          onCancel={onBackToChannels}
        />
      {:else}
        {@render channels()}
      {/if}
    </div>
  </div>
</Modal>

{#snippet channels()}
  <ChannelSetupStep
    title="Add a notification channel"
    description="Every monitor on this domain alerts it."
    backLabel="Cancel"
    onBack={closeModal}
  >
    <div class="flex flex-col gap-2">
      {#each availableChannels as channel (channel.id)}
        {@const locked = !allowedNotificationChannels.includes(channel.id)}
        <UpgradeElement
          class="w-full"
          enabled={locked}
          source="notification-channel-setup"
        >
          <button
            type="button"
            class="edge hover:bg-surface-elevated-hover-bg focus-visible:bg-surface-elevated-hover-bg flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 text-left text-sm outline-none select-none"
            onclick={() => {
              if (locked) {
                return;
              }

              notificationChannelSetupState.selectChannel(channel.id);
              channel.onclick();
            }}
          >
            <channel.icon class="text-fg-secondary size-4 shrink-0" />
            <span>{channel.name}</span>

            {#if locked}
              {@const requiredTier =
                exposedConfigState.firstTierWithNotificationChannel(channel.id)}
              <Badge size="sm" class="ml-auto">
                {requiredTier
                  ? `Upgrade to ${exposedConfigState.formatTierName(requiredTier)}`
                  : 'Upgrade'}
              </Badge>
            {:else}
              <ChevronRightIcon class="text-fg-muted ml-auto size-3.5" />
            {/if}
          </button>
        </UpgradeElement>
      {/each}
    </div>
  </ChannelSetupStep>
{/snippet}
