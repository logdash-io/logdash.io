<script lang="ts">
  import { page } from '$app/state';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { envConfig } from '$lib/domains/shared/utils/env-config';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { CheckIcon, CopyIcon } from 'lucide-svelte';
  import { untrack } from 'svelte';

  type Props = {
    projectId: string;
  };
  const { projectId }: Props = $props();

  const MIN_NAME_LENGTH = 3;
  const MAX_NAME_LENGTH = 800;

  const clusterId = $derived(page.params.cluster_id);

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
      createPushMonitor();
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
    } catch {
      toast.error('Failed to create monitor');
    } finally {
      isCreatingPushMonitor = false;
    }
  }

  async function onFinishSetup(): Promise<void> {
    if (!isFormValid || isSubmitting) return;

    isSubmitting = true;

    try {
      const finalUrl =
        selectedMode === MonitorMode.PULL ? tryPrependProtocol(url) : undefined;

      const createdMonitorId = await monitoringState.createMonitor(projectId, {
        projectId,
        name: monitorName,
        mode: selectedMode,
        url: finalUrl,
      });

      await monitoringState.claimMonitor(createdMonitorId);
      await monitoringState.sync(clusterId);
    } catch {
      toast.error('Failed to setup monitoring');
      isSubmitting = false;
    }
  }

  function onCopyEndpoint(): void {
    if (!pushEndpoint) {
      toast.error('Monitor not found');
      return;
    }

    navigator.clipboard.writeText(pushEndpoint);
    toast.success('Endpoint copied to clipboard');
  }
</script>

<div class="flex w-full max-w-2xl flex-col gap-6 ld-card">
  <div class="space-y-2">
    <h5 class="text-2xl font-semibold">Setup Monitoring for your service</h5>

    <p class="text-base-content opacity-60">
      Monitor your services uptime and get alerted when they go down.
    </p>
  </div>

  <div class="space-y-4">
    <div class="tabs tabs-boxed tabs-sm w-fit">
      <button
        class={[
          'tab px-4',
          { 'tab-active bg-base-100': selectedMode === MonitorMode.PULL },
        ]}
        onclick={() => (selectedMode = MonitorMode.PULL)}
        type="button"
      >
        Pull (we ping you)
      </button>
      {#if canUsePush}
        <button
          class={[
            'tab px-4',
            { 'tab-active bg-base-100': selectedMode === MonitorMode.PUSH },
          ]}
          onclick={() => (selectedMode = MonitorMode.PUSH)}
          type="button"
        >
          Push (you ping us)
        </button>
      {:else}
        <Tooltip
          content="Upgrade to Pro to use Push monitors"
          placement="bottom"
        >
          <button
            class={[
              'tab px-4',
              {
                'tab-active bg-base-100': selectedMode === MonitorMode.PUSH,
                'opacity-60 cursor-not-allowed': true,
              },
            ]}
            disabled={true}
            type="button"
          >
            Push (Heartbeat)
          </button>
        </Tooltip>
      {/if}
    </div>

    <div class="space-y-4">
      {#if selectedMode === MonitorMode.PULL}
        <div class="space-y-2">
          <label class="label font-medium">Monitor name</label>
          <input
            bind:value={monitorName}
            minlength={MIN_NAME_LENGTH}
            maxlength={MAX_NAME_LENGTH}
            class="input input-bordered w-full"
            placeholder="My API Service"
            use:autoFocus={{ delay: 100 }}
          />
        </div>

        <div class="space-y-2">
          <label class="label font-medium">URL to monitor</label>
          <input
            bind:value={url}
            minlength={MIN_NAME_LENGTH}
            maxlength={MAX_NAME_LENGTH}
            class="input input-bordered w-full"
            placeholder="https://example.com/health"
          />
          <p class="text-xs opacity-60">
            We'll ping this URL every 15 seconds to check if it's healthy.
          </p>
        </div>
      {:else}
        <div class="space-y-2">
          <label class="label font-medium">Monitor name</label>
          <input
            bind:value={monitorName}
            minlength={MIN_NAME_LENGTH}
            maxlength={MAX_NAME_LENGTH}
            class="input input-bordered w-full"
            placeholder="My Backend Service"
            use:autoFocus={{ delay: 100 }}
          />
          <p class="text-xs opacity-60">
            Your service will send heartbeat pings to our endpoint.
          </p>
        </div>

        {#if isCreatingPushMonitor}
          <div class="border-base-300 border-t pt-4">
            <div class="flex items-center gap-2 text-sm opacity-60">
              <span class="loading loading-spinner loading-xs"></span>
              Generating endpoint...
            </div>
          </div>
        {:else if pushEndpoint}
          <div class="border-base-300 border-t pt-4">
            <div class="space-y-3">
              <div class="space-y-1">
                <p class="text-sm font-medium">Ping endpoint</p>
                <p class="text-xs opacity-60">
                  Send a POST request to this URL from your service:
                </p>
              </div>
              <div class="flex items-center gap-2">
                <code
                  class="bg-base-200 flex-1 truncate rounded px-3 py-2 font-mono text-sm"
                >
                  {pushEndpoint}
                </code>
                <Tooltip content="Copy endpoint" placement="top">
                  <button
                    onclick={onCopyEndpoint}
                    class="btn btn-square btn-sm btn-ghost"
                  >
                    <CopyIcon class="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <button
      class="btn btn-primary"
      disabled={!isFormValid || isSubmitting}
      onclick={onFinishSetup}
    >
      {#if isSubmitting}
        <span class="loading loading-spinner loading-sm"></span>
      {:else}
        <CheckIcon class="h-4 w-4" />
      {/if}
      Finish Setup
    </button>
  </div>
</div>
