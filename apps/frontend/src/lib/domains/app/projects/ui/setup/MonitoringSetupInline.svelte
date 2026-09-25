<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
  import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error.js';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { envConfig } from '$lib/domains/shared/utils/env-config';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import {
    Button,
    Input,
    Label,
    Spinner,
    Tab,
    Tabs,
    Tooltip,
  } from '@logdash/hyper-ui/presentational';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { untrack } from 'svelte';
  import { fromAction } from 'svelte/attachments';

  type Props = {
    clusterId: string;
    projectId: string;
  };
  const { clusterId, projectId }: Props = $props();

  const MIN_NAME_LENGTH = 3;
  const MAX_NAME_LENGTH = 800;
  const MONITOR_LIMIT_MESSAGE =
    'Too many monitors waiting to be set up. Try again in a few minutes.';

  let selectedMode = $state<MonitorMode>(MonitorMode.PULL);
  let url = $state('');
  let monitorName = $state('');
  let isSubmitting = $state(false);
  let pendingMonitorId = $state<string | undefined>();

  const urlValid = $derived(isValidUrl(url));
  const nameValid = $derived(monitorName.length >= MIN_NAME_LENGTH);
  const isFormValid = $derived(
    selectedMode === MonitorMode.PULL
      ? urlValid && nameValid
      : nameValid && Boolean(pendingMonitorId),
  );
  const canUsePush = $derived(userState.isPro);
  const pushEndpoint = $derived(
    pendingMonitorId ? `${envConfig.apiBaseUrl}/ping/${pendingMonitorId}` : '',
  );
  let isCreatingPushMonitor = $state(false);

  $effect(() => {
    if (selectedMode !== MonitorMode.PUSH) return;
    if (!nameValid) return;

    untrack(() => {
      if (pendingMonitorId || isCreatingPushMonitor) return;
      void createPushMonitor();
    });
  });

  async function createPushMonitor(): Promise<void> {
    isCreatingPushMonitor = true;
    try {
      const createdMonitorId = await monitoringState.createMonitor(projectId, {
        projectId,
        name: monitorName,
        mode: MonitorMode.PUSH,
        url: undefined,
      });
      pendingMonitorId = createdMonitorId;
    } catch (error) {
      toast.error(
        readHttpErrorStatus(error) === 409
          ? MONITOR_LIMIT_MESSAGE
          : 'Failed to create monitor',
      );
    } finally {
      isCreatingPushMonitor = false;
    }
  }

  async function onFinishSetup(): Promise<void> {
    if (!isFormValid || isSubmitting) return;

    isSubmitting = true;

    try {
      if (selectedMode === MonitorMode.PUSH) {
        await finishPushSetup();
      } else {
        await finishPullSetup();
      }

      await monitoringState.sync(clusterId);
    } catch (error) {
      toast.error(
        readHttpErrorStatus(error) === 409
          ? MONITOR_LIMIT_MESSAGE
          : 'Failed to setup monitoring',
      );
      isSubmitting = false;
    }
  }

  async function finishPushSetup(): Promise<void> {
    if (!pendingMonitorId) {
      throw new Error('Push monitor is not ready yet');
    }

    const pendingMonitor =
      monitoringState.getUnclaimedMonitor(pendingMonitorId);

    if (pendingMonitor && pendingMonitor.name !== monitorName) {
      await monitoringState.updateMonitor(pendingMonitorId, {
        name: monitorName,
      });
    }

    await monitoringState.claimMonitor(pendingMonitorId);
  }

  async function finishPullSetup(): Promise<void> {
    const createdMonitorId = await monitoringState.createMonitor(projectId, {
      projectId,
      name: monitorName,
      mode: MonitorMode.PULL,
      url: tryPrependProtocol(url),
    });

    await monitoringState.claimMonitor(createdMonitorId);
  }

  async function onCopyEndpoint(): Promise<void> {
    if (!pushEndpoint) {
      toast.error('Monitor not found');
      return;
    }

    await navigator.clipboard.writeText(pushEndpoint);
    toast.success('Endpoint copied to clipboard');
  }
</script>

<div class="flex w-full max-w-2xl flex-col gap-6 ld-card">
  <div class="space-y-2">
    <h5 class="text-2xl font-medium">Setup Monitoring for your service</h5>

    <p class="text-neutral-400">
      Monitor your services uptime and get alerted when they go down.
    </p>
  </div>

  <div class="space-y-4">
    <Tabs size="sm" class="w-fit">
      <Tab
        class="px-4"
        active={selectedMode === MonitorMode.PULL}
        onclick={() => (selectedMode = MonitorMode.PULL)}
      >
        Pull (we ping you)
      </Tab>
      {#if canUsePush}
        <Tab
          class="px-4"
          active={selectedMode === MonitorMode.PUSH}
          onclick={() => (selectedMode = MonitorMode.PUSH)}
        >
          Push (you ping us)
        </Tab>
      {:else}
        <Tooltip
          content="Upgrade to Pro to use Push monitors"
          placement="bottom"
        >
          <Tab
            class="text-fg-faint pointer-events-auto cursor-not-allowed px-4 opacity-100"
            active={selectedMode === MonitorMode.PUSH}
            disabled={true}
          >
            Push (Heartbeat)
          </Tab>
        </Tooltip>
      {/if}
    </Tabs>

    <div class="space-y-4">
      {#if selectedMode === MonitorMode.PULL}
        <div class="space-y-2">
          <Label class="font-medium" for="monitor-name-pull">
            Monitor name
          </Label>
          <Input
            id="monitor-name-pull"
            bind:value={monitorName}
            minlength={MIN_NAME_LENGTH}
            maxlength={MAX_NAME_LENGTH}
            class="w-full"
            placeholder="My API Service"
            {@attach fromAction(autoFocus, () => ({ delay: 100 }))}
          />
        </div>

        <div class="space-y-2">
          <Label class="font-medium" for="monitor-url">URL to monitor</Label>
          <Input
            id="monitor-url"
            bind:value={url}
            minlength={MIN_NAME_LENGTH}
            maxlength={MAX_NAME_LENGTH}
            class="w-full"
            placeholder="https://example.com/health"
          />
          <p class="text-neutral-400 text-xs">
            Checked every 5 minutes on the free plan, every 15 seconds on Pro.
          </p>
        </div>
      {:else}
        <div class="space-y-2">
          <Label class="font-medium" for="monitor-name-push">
            Monitor name
          </Label>
          <Input
            id="monitor-name-push"
            bind:value={monitorName}
            minlength={MIN_NAME_LENGTH}
            maxlength={MAX_NAME_LENGTH}
            class="w-full"
            placeholder="My Backend Service"
            {@attach fromAction(autoFocus, () => ({ delay: 100 }))}
          />
          <p class="text-neutral-400 text-xs">
            Your service will send heartbeat pings to our endpoint.
          </p>
        </div>

        {#if isCreatingPushMonitor}
          <div class="border-surface-root border-t pt-4">
            <div class="text-neutral-400 flex items-center gap-2 text-sm">
              <Spinner size="xs" aria-hidden="true" />
              Generating endpoint...
            </div>
          </div>
        {:else if pushEndpoint}
          <div class="border-surface-root border-t pt-4">
            <div class="space-y-3">
              <div class="space-y-1">
                <p class="text-sm font-medium">Ping endpoint</p>
                <p class="text-neutral-400 text-xs">
                  Send a POST request to this URL from your service:
                </p>
              </div>
              <div class="flex items-center gap-2">
                <code
                  class="bg-surface-well flex-1 truncate rounded-xl px-3 py-2 font-mono text-sm"
                >
                  {pushEndpoint}
                </code>
                <Tooltip content="Copy endpoint" placement="top">
                  <Button
                    variant="ghost"
                    size="sm"
                    shape="square"
                    aria-label="Copy endpoint"
                    onclick={onCopyEndpoint}
                  >
                    <CopyIcon class="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <Button
      variant="primary"
      disabled={!isFormValid || isSubmitting}
      onclick={onFinishSetup}
    >
      {#if isSubmitting}
        <Spinner size="sm" aria-hidden="true" />
      {:else}
        <CheckIcon class="h-4 w-4" />
      {/if}
      Finish Setup
    </Button>
  </div>
</div>
